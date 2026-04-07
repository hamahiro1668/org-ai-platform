from __future__ import annotations
import time
import os
from typing import List
from anthropic import AsyncAnthropic
from tenacity import retry, stop_after_attempt, wait_exponential

from app.models.llm import ChatMessage, LLMResponse

DEFAULT_MODEL = "claude-sonnet-4-6"
FALLBACK_MODEL = "claude-haiku-4-5-20251001"


class AnthropicProvider:
    def __init__(self) -> None:
        api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        self.client = AsyncAnthropic(api_key=api_key) if api_key else None

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    async def chat(self, messages: List[ChatMessage], model: str = DEFAULT_MODEL) -> LLMResponse:
        if not self.client:
            raise RuntimeError("ANTHROPIC_API_KEY is not set")
        start = time.monotonic()

        # Anthropic requires system message separated from user messages
        system_content = ""
        user_messages = []
        for m in messages:
            if m.role == "system":
                system_content += m.content + "\n"
            else:
                user_messages.append({"role": m.role, "content": m.content})

        try:
            response = await self.client.messages.create(
                model=model,
                max_tokens=4096,
                system=system_content.strip() if system_content else "",
                messages=user_messages,
            )
            latency_ms = int((time.monotonic() - start) * 1000)
            content = response.content[0].text if response.content else ""
            tokens = (response.usage.input_tokens + response.usage.output_tokens) if response.usage else 0
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
