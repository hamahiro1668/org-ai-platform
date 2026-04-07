from __future__ import annotations
import logging
import uuid
from typing import Optional, List
from sqlalchemy import text
from app.db import AsyncSessionLocal

logger = logging.getLogger(__name__)


def _calc_risk_score(pii_detected: bool, pii_types: List[str], tokens: Optional[int]) -> float:
    """
    シンプルなルールベースのリスクスコア計算 (0.0〜1.0)
    - PII なし → 0.0
    - PII 種別数・種類でスコアを加算
    - クレジットカード・マイナンバーは高リスク
    """
    if not pii_detected:
        return 0.0
    score = 0.1 * len(pii_types)
    if "CREDIT_CARD" in pii_types:
        score += 0.5
    if "MY_NUMBER" in pii_types:
        score += 0.4
    if "PHONE" in pii_types:
        score += 0.1
    if "EMAIL" in pii_types:
        score += 0.1
    return min(score, 1.0)


async def log_llm_call(
    *,
    org_id: str,
    department: str,
    provider: str,
    model: str,
    input_text: str,
    output_text: Optional[str],
    tokens: Optional[int],
    latency_ms: Optional[int],
    pii_detected: bool,
    pii_types: List[str],
) -> Optional[str]:
    """AI呼び出しを AILog テーブルに記録し、PII 検出時は RiskEvent も挿入する。"""
    risk_score = _calc_risk_score(pii_detected, pii_types, tokens)
    log_id = str(uuid.uuid4())

    try:
        async with AsyncSessionLocal() as db:
            await db.execute(
                text("""
                INSERT INTO "AILog" (id, "orgId", department, provider, model,
                    "inputText", "outputText", tokens, "latencyMs", "riskScore", "createdAt")
                VALUES (:id, :org_id, :department, :provider, :model,
                    :input_text, :output_text, :tokens, :latency_ms, :risk_score, NOW())
                """),
                {
                    "id": log_id,
                    "org_id": org_id,
                    "department": department,
                    "provider": provider,
                    "model": model,
                    "input_text": input_text[:4000],   # 長すぎる入力を切り詰め
                    "output_text": (output_text or "")[:4000],
                    "tokens": tokens,
                    "latency_ms": latency_ms,
                    "risk_score": risk_score,
                },
            )

            if pii_detected:
                severity = "HIGH" if risk_score >= 0.5 else "MEDIUM"
                await db.execute(
                    text("""
                    INSERT INTO "RiskEvent" (id, "orgId", "aiLogId", type, description, severity, resolved, "createdAt")
                    VALUES (:id, :org_id, :ai_log_id, 'PII_DETECTED', :description, :severity, false, NOW())
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "org_id": org_id,
                        "ai_log_id": log_id,
                        "description": f"PII detected and masked: {', '.join(pii_types)}",
                        "severity": severity,
                    },
                )

            await db.commit()
    except Exception as e:
        logger.warning("audit_logger failed (non-fatal): %s", e)
        return None

    return log_id
