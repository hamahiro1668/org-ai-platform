from __future__ import annotations
import time
import os
from typing import AsyncIterator, List
from groq import AsyncGroq
from tenacity import retry, stop_after_attempt, wait_exponential

from app.models.llm import ChatMessage, LLMResponse

PRIMARY_MODEL = "llama-3.3-70b-versatile"
FALLBACK_MODEL = "llama-3.1-8b-instant"


class GroqProvider:
    def __init__(self) -> None:
        self.client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    async def chat(self, messages: List[ChatMessage], model: str = PRIMARY_MODEL) -> LLMResponse:
        start = time.monotonic()
        try:
            completion = await self.client.chat.completions.create(
                model=model,
                messages=[{"role": m.role, "content": m.content} for m in messages],
                timeout=30,
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
        except Exception:
            if model == PRIMARY_MODEL:
                return await self.chat(messages, FALLBACK_MODEL)
            raise

    async def chat_stream(
        self, messages: List[ChatMessage], model: str = PRIMARY_MODEL
    ) -> AsyncIterator[str]:
        """Yield content tokens one by one via Groq streaming API."""
        formatted = [{"role": m.role, "content": m.content} for m in messages]
        try:
            stream = await self.client.chat.completions.create(
                model=model,
                messages=formatted,
                stream=True,
                timeout=60,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    yield delta.content
        except Exception:
            if model == PRIMARY_MODEL:
                async for token in self.chat_stream(messages, FALLBACK_MODEL):
                    yield token
            else:
                raise
