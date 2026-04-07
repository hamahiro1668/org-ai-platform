import { api } from '../../services/api';

/** バックエンドAPI経由でタスクを作成し、n8nワークフローを自動トリガーする */
export async function createTaskFromChat(params: {
  department: string;
  userMessage: string;
  aiResponse: string;
}): Promise<{ id: string; title: string; department: string; status: string }> {
  const { department, userMessage, aiResponse } = params;
  const title = userMessage.length > 40 ? userMessage.slice(0, 40) + '...' : userMessage;
  const input = `【チャットから自動生成】\n\n指示: ${userMessage}\n\nAI回答:\n${aiResponse}`;

  const res = await api.post<{ success: boolean; data: { id: string; title: string; department: string; status: string } }>(
    '/tasks',
    { title, department, input, status: 'QUEUED' },
  );

  return res.data.data;
}
