from pydantic import BaseModel
from typing import Optional


class ChatMessage(BaseModel):
    role: str  # user | assistant | system
    content: str


class LLMRequest(BaseModel):
    messages: list[ChatMessage]
    department: str
    org_id: str
    plan: str = "STARTER"


class LLMResponse(BaseModel):
    content: str
    model: str
    tokens_used: int
    latency_ms: int
    pii_detected: bool


class OrchestateRequest(BaseModel):
    message: str
    org_id: str
    session_id: str
    plan: str = "STARTER"
    department: Optional[str] = None


class OrchestrateResponse(BaseModel):
    content: str
    department: str
    model: str
    tokens_used: int
    latency_ms: int
