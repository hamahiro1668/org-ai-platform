import os
import asyncio
import json
import time
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.models.llm import OrchestateRequest, OrchestrateResponse, LLMRequest, LLMResponse, ChatMessage
from app.orchestrator.orchestrator import orchestrator
from app.orchestrator.intent_classifier import classify_intent
from app.llm.router import llm_router
from app.governance.audit_logger import log_llm_call
from app.governance.pii_screener import screen

app = FastAPI(title="AI Engine", version="1.0.0")

allowed_origins = os.getenv("API_GATEWAY_URL", "http://localhost:4000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "1.0.0", "timestamp": __import__("datetime").datetime.utcnow().isoformat()}


@app.post("/orchestrate", response_model=OrchestrateResponse)
async def orchestrate(request: OrchestateRequest) -> OrchestrateResponse:
    return await orchestrator.process(
        user_message=request.message,
        org_id=request.org_id,
        plan=request.plan,
        department=request.department,
    )


@app.post("/orchestrate/stream")
async def orchestrate_stream(request: OrchestateRequest) -> StreamingResponse:
    """SSE ストリーミングエンドポイント。トークンを1つずつ返す。"""
    # 部署を解決
    if request.department and request.department in ("SALES", "MARKETING", "ACCOUNTING", "GENERAL"):
        resolved_dept = request.department
    else:
        resolved_dept = await classify_intent(request.message)

    # エージェントのシステムプロンプトを取得
    from app.orchestrator.orchestrator import _agents
    agent = _agents.get(resolved_dept, _agents["GENERAL"])
    messages = [ChatMessage(role="system", content=agent.system_prompt)]
    messages.append(ChatMessage(role="user", content=request.message))

    # PII スクリーニング
    pii_detected = False
    pii_types: list[str] = []
    for i, msg in enumerate(messages):
        if msg.role == "user":
            result = screen(msg.content)
            if result.detected:
                pii_detected = True
                pii_types.extend(result.types)
                messages[i] = ChatMessage(role=msg.role, content=result.text)

    async def event_generator():
        start = time.monotonic()
        full_content = ""
        # 最初に部署情報を送信
        yield f"data: {json.dumps({'type': 'department', 'department': resolved_dept})}\n\n"
        try:
            async for token in llm_router.chat_stream(
                messages=messages,
                department=resolved_dept,
                org_id=request.org_id,
                plan=request.plan,
            ):
                full_content += token
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

            latency_ms = int((time.monotonic() - start) * 1000)
            # 完了イベント
            yield f"data: {json.dumps({'type': 'done', 'department': resolved_dept})}\n\n"

            # 監査ログを非同期で記録
            asyncio.create_task(log_llm_call(
                org_id=request.org_id,
                department=resolved_dept,
                provider="groq",
                model="llama-3.3-70b-versatile",
                input_text=request.message,
                output_text=full_content,
                tokens=None,
                latency_ms=latency_ms,
                pii_detected=pii_detected,
                pii_types=pii_types,
            ))
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@app.post("/llm/chat", response_model=LLMResponse)
async def llm_chat(request: LLMRequest) -> LLMResponse:
    response, _pii, _types = await llm_router.chat(
        messages=request.messages,
        department=request.department,
        org_id=request.org_id,
        plan=request.plan,
    )
    return response
