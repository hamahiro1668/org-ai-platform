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

# 自由記述の「本文生成」用モデル（品質重視）。STARTER でも Sonnet を下限にし、MAX は Opus。
# 提案書・報告書・チャット回答などの文章品質を上げるため。
_PLAN_CONTENT_MODEL = {
    "STARTER": MODEL_SONNET,
    "PRO": MODEL_SONNET,
    "MAX": MODEL_OPUS,
}

_anthropic: AnthropicProvider | None = None


def _get_anthropic() -> AnthropicProvider:
    global _anthropic
    if _anthropic is None:
        _anthropic = AnthropicProvider()
    return _anthropic


def _resolve_model(plan: str, json_mode: bool = False) -> str:
    """モデル選択。
    - json_mode（意図分類・capability選択・重要度ランキング等の構造化処理）= 安価で十分な Haiku。
    - それ以外（自由記述の本文生成）= 品質重視で Sonnet 以上（MAX は Opus）。
    """
    if json_mode:
        return MODEL_HAIKU
    return _PLAN_CONTENT_MODEL.get(plan, MODEL_SONNET)


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
        model = _resolve_model(plan, json_mode)
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
