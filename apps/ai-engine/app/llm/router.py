from __future__ import annotations
import logging
from typing import AsyncIterator, List, Tuple
from app.models.llm import ChatMessage, LLMResponse
from app.governance.pii_screener import screen
from app.llm.providers.groq import GroqProvider

logger = logging.getLogger(__name__)

_groq = GroqProvider()

# Lazy-load expensive providers
_openai = None
_anthropic = None


def _get_openai():
    global _openai
    if _openai is None:
        from app.llm.providers.openai_provider import OpenAIProvider
        _openai = OpenAIProvider()
    return _openai


def _get_anthropic():
    global _anthropic
    if _anthropic is None:
        from app.llm.providers.anthropic_provider import AnthropicProvider
        _anthropic = AnthropicProvider()
    return _anthropic


class LLMRouter:
    async def chat(
        self,
        messages: List[ChatMessage],
        department: str,
        org_id: str,
        plan: str = "STARTER",
    ) -> Tuple[LLMResponse, bool, List[str]]:
        pii_detected = False
        pii_types: List[str] = []
        screened_messages = list(messages)
        for i, msg in enumerate(screened_messages):
            if msg.role == "user":
                result = screen(msg.content)
                if result.detected:
                    pii_detected = True
                    pii_types.extend(result.types)
                    screened_messages[i] = ChatMessage(role=msg.role, content=result.text)

        # Plan-based routing:
        #   STARTER (Free)  -> Groq (Llama)
        #   PRO             -> OpenAI (GPT-4o)
        #   MAX             -> Anthropic (Claude)
        response: LLMResponse
        if plan == "MAX":
            try:
                provider = _get_anthropic()
                response = await provider.chat(screened_messages)
                logger.info(f"[LLMRouter] plan=MAX -> Anthropic ({response.model})")
            except Exception as e:
                logger.warning(f"[LLMRouter] Anthropic failed, falling back to Groq: {e}")
                response = await _groq.chat(screened_messages)
        elif plan == "PRO":
            try:
                provider = _get_openai()
                response = await provider.chat(screened_messages)
                logger.info(f"[LLMRouter] plan=PRO -> OpenAI ({response.model})")
            except Exception as e:
                logger.warning(f"[LLMRouter] OpenAI failed, falling back to Groq: {e}")
                response = await _groq.chat(screened_messages)
        else:
            response = await _groq.chat(screened_messages)
            logger.info(f"[LLMRouter] plan=STARTER -> Groq ({response.model})")

        response.pii_detected = pii_detected
        return response, pii_detected, pii_types

    async def chat_stream(
        self,
        messages: List[ChatMessage],
        department: str,
        org_id: str,
        plan: str = "STARTER",
    ) -> AsyncIterator[str]:
        """Stream tokens with PII screening applied to user messages."""
        screened_messages = list(messages)
        for i, msg in enumerate(screened_messages):
            if msg.role == "user":
                result = screen(msg.content)
                if result.detected:
                    screened_messages[i] = ChatMessage(role=msg.role, content=result.text)

        # Streaming は Groq のみ対応（デモ向け）
        async for token in _groq.chat_stream(screened_messages):
            yield token


llm_router = LLMRouter()
