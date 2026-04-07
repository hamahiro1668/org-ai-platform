from __future__ import annotations
import logging
from app.models.llm import ChatMessage
from app.llm.providers.groq import GroqProvider

logger = logging.getLogger(__name__)
_groq = GroqProvider()

DEPARTMENTS = ["SALES", "MARKETING", "ACCOUNTING", "ANALYTICS", "GENERAL"]

CLASSIFIER_PROMPT = """ユーザーの入力を分析し、最も適切な部署を以下から1つだけ選んでください。
部署名のみを回答してください（他の文字は一切含めないこと）：
- SALES: 営業、メール作成、提案書、見積もり、顧客対応、議事録、商談、スケジュール調整
- MARKETING: SNS投稿、マーケティング、広告、キャンペーン、コピーライティング、ツイート、Instagram
- ACCOUNTING: 経理、会計、請求書、経費、予算、税務、領収書、月次レポート
- ANALYTICS: データ分析、市場調査、グラフ、チャート、KPI、統計、トレンド、競合分析、可視化
- GENERAL: 上記に当てはまらない一般的な質問・タスク"""


async def classify_intent(user_message: str) -> str:
    messages = [
        ChatMessage(role="system", content=CLASSIFIER_PROMPT),
        ChatMessage(role="user", content=user_message),
    ]
    try:
        response = await _groq.chat(messages)
        department = response.content.strip().upper()
        if department in DEPARTMENTS:
            return department
        logger.warning("classify_intent: unexpected response '%s', falling back to GENERAL", department)
    except Exception as e:
        logger.error("classify_intent failed: %s", e)
    return "GENERAL"
