from __future__ import annotations
import asyncio
import logging
import re
import time
import os
from typing import AsyncIterator, List
from groq import AsyncGroq, RateLimitError

from app.models.llm import ChatMessage, LLMResponse

logger = logging.getLogger(__name__)

PRIMARY_MODEL = "llama-3.3-70b-versatile"
FALLBACK_MODEL = "llama-3.1-8b-instant"


def _parse_retry_after(error: BaseException) -> float:
    """レート制限エラーから待機秒数を抽出する（Please try again in 31.95s 等）。"""
    msg = str(error)
    match = re.search(
        r"(?:please\s+)?try\s+again\s+in\s+(\d+(?:\.\d+)?)\s*s",
        msg,
        re.IGNORECASE,
    )
    if match:
        return min(float(match.group(1)), 120.0)
    return 5.0


class GroqProvider:
    """Groq クライアントは初回呼び出し時まで遅延初期化（未設定キーでもアプリ起動・/health を可能にする）。"""

    def __init__(self) -> None:
        self._client: AsyncGroq | None = None

    def _client_or_raise(self) -> AsyncGroq:
        if self._client is None:
            key = os.environ.get("GROQ_API_KEY", "").strip()
            if not key:
                raise RuntimeError("GROQ_API_KEY environment variable is not set")
            self._client = AsyncGroq(api_key=key)
        return self._client

    async def chat(
        self,
        messages: List[ChatMessage],
        model: str = PRIMARY_MODEL,
        *,
        json_mode: bool = False,
    ) -> LLMResponse:
        start = time.monotonic()
        client = self._client_or_raise()
        formatted = [{"role": m.role, "content": m.content} for m in messages]
        for attempt in range(3):
            try:
                completion = await client.chat.completions.create(
                    model=model,
                    messages=formatted,
                    timeout=30,
                    **({"response_format": {"type": "json_object"}} if json_mode else {}),
                )
                latency_ms = int((time.monotonic() - start) * 1000)
                content = completion.choices[0].message.content or ""
                tokens = completion.usage.total_tokens if completion.usage else 0
                return LLMResponse(
                    content=content,
                    model=model,
                    tokens_used=tokens,
                    latency_ms=latency_ms,
                    pii_detected=False,
                )
            except RateLimitError as e:
                if model == PRIMARY_MODEL:
                    logger.warning(
                        "[Groq] Rate limited on %s, switching to %s", PRIMARY_MODEL, FALLBACK_MODEL
                    )
                    return await self.chat(messages, FALLBACK_MODEL, json_mode=json_mode)
                wait_sec = _parse_retry_after(e)
                logger.warning("[Groq] Rate limited (attempt %d/3), waiting %.1fs", attempt + 1, wait_sec)
                if attempt < 2:
                    await asyncio.sleep(wait_sec)
                else:
                    raise
            except Exception:
                if model == PRIMARY_MODEL:
                    return await self.chat(messages, FALLBACK_MODEL, json_mode=json_mode)
                raise
        raise RuntimeError("Groq chat: max retries exceeded")

    async def chat_stream(
        self, messages: List[ChatMessage], model: str = PRIMARY_MODEL
    ) -> AsyncIterator[str]:
        """Yield content tokens one by one via Groq streaming API."""
        formatted = [{"role": m.role, "content": m.content} for m in messages]
        client = self._client_or_raise()
        for attempt in range(3):
            try:
                stream = await client.chat.completions.create(
                    model=model,
                    messages=formatted,
                    stream=True,
                    timeout=60,
                )
                async for chunk in stream:
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        yield delta.content
                return
            except RateLimitError as e:
                if model == PRIMARY_MODEL:
                    logger.warning("[Groq] Stream rate limited on primary, falling back to %s", FALLBACK_MODEL)
                    async for token in self.chat_stream(messages, FALLBACK_MODEL):
                        yield token
                    return
                wait_sec = _parse_retry_after(e)
                logger.warning("[Groq] Stream rate limited (attempt %d/3), waiting %.1fs", attempt + 1, wait_sec)
                if attempt < 2:
                    await asyncio.sleep(wait_sec)
                else:
                    raise
            except Exception:
                if model == PRIMARY_MODEL:
                    async for token in self.chat_stream(messages, FALLBACK_MODEL):
                        yield token
                    return
                raise
