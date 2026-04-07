from __future__ import annotations
import time
import os
from typing import List
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from app.models.llm import ChatMessage, LLMResponse

DEFAULT_MODEL = "gpt-4o"
FALLBACK_MODEL = "gpt-4o-mini"


class OpenAIProvider:
    def __init__(self) -> None:
        api_key = os.environ.get("OPENAI_API_KEY", "")
        self.client = AsyncOpenAI(api_key=api_key) if api_key else None

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    async def chat(self, messages: List[ChatMessage], model: str = DEFAULT_MODEL) -> LLMResponse:
        if not self.client:
            raise RuntimeError("OPENAI_API_KEY is not set")
        start = time.monotonic()
        try:
            completion = await self.client.chat.completions.create(
                model=model,
                messages=[{"role": m.role, "content": m.content} for m in messages],
                timeout=60,
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
            if model == DEFAULT_MODEL:
                return await self.chat(messages, FALLBACK_MODEL)
            raise
