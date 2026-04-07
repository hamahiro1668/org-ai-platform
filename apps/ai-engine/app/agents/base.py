from __future__ import annotations
from typing import Optional, List, Tuple
from app.models.llm import ChatMessage, LLMResponse
from app.llm.router import llm_router


class BaseAgent:
    department: str = "GENERAL"
    system_prompt: str = "あなたは有能なAIアシスタントです。"

    async def execute(
        self,
        user_message: str,
        org_id: str,
        plan: str = "STARTER",
        history: Optional[List[ChatMessage]] = None,
    ) -> Tuple[LLMResponse, bool, List[str]]:
        messages: List[ChatMessage] = [
            ChatMessage(role="system", content=self.system_prompt),
        ]
        if history:
            messages.extend(history[-10:])
        messages.append(ChatMessage(role="user", content=user_message))

        return await llm_router.chat(
            messages=messages,
            department=self.department,
            org_id=org_id,
            plan=plan,
        )
