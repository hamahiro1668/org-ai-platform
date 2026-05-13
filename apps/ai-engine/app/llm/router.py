from __future__ import annotations
import logging
from typing import AsyncIterator, List, Tuple
from app.models.llm import ChatMessage, LLMResponse
from app.governance.pii_screener import screen
from app.llm.providers.anthropic_provider import (
    AnthropicProvider,
    MODEL_HAIKU,
    MODEL_SONNET,
    MODEL_OPUS,
)

logger = logging.getLogger(__name__)

# プラン → Claude モデル ID
_PLAN_MODEL = {
    "STARTER": MODEL_HAIKU,
    "PRO": MODEL_SONNET,
    "MAX": MODEL_OPUS,
}

_anthropic: AnthropicProvider | None = None


def _get_anthropic() -> AnthropicProvider:
    global _anthropic
    if _anthropic is None:
        _anthropic = AnthropicProvider()
    return _anthropic


def _resolve_model(plan: str) -> str:
    return _PLAN_MODEL.get(plan, MODEL_HAIKU)


def _screen_user_messages(messages: List[ChatMessage]) -> Tuple[List[ChatMessage], bool, List[str]]:
    pii_detected = False
    pii_types: List[str] = []
    screened = list(messages)
    for i, msg in enumerate(screened):
        if msg.role == "user":
            result = screen(msg.content)
            if result.detected:
                pii_detected = True
                pii_types.extend(result.types)
                screened[i] = ChatMessage(role=msg.role, content=result.text)
    return screened, pii_detected, pii_types


class LLMRouter:
    async def chat(
        self,
        messages: List[ChatMessage],
        department: str,
        org_id: str,
        plan: str = "STARTER",
        json_mode: bool = False,
    ) -> Tuple[LLMResponse, bool, List[str]]:
        screened_messages, pii_detected, pii_types = _screen_user_messages(messages)
        model = _resolve_model(plan)
        provider = _get_anthropic()
        response = await provider.chat(screened_messages, model=model, json_mode=json_mode)
        logger.info(f"[LLMRouter] plan={plan} -> Anthropic ({response.model})")
        response.pii_detected = pii_detected
        return response, pii_detected, pii_types

    async def chat_stream(
        self,
        messages: List[ChatMessage],
        department: str,
        org_id: str,
        plan: str = "STARTER",
    ) -> AsyncIterator[str]:
        """Stream tokens via Anthropic with PII screening applied to user messages."""
        screened_messages, _, _ = _screen_user_messages(messages)
        model = _resolve_model(plan)
        provider = _get_anthropic()
        async for token in provider.chat_stream(screened_messages, model=model):
            yield token


llm_router = LLMRouter()
