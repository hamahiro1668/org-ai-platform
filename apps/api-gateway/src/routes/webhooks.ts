import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const WEBHOOK_AUTH_TOKEN = process.env.N8N_WEBHOOK_AUTH_TOKEN ?? 'org-ai-n8n-secret-token';

const taskCompleteSchema = z.object({
  taskId: z.string(),
  status: z.enum(['DONE', 'FAILED']),
  output: z.string().optional(),
  error: z.string().optional(),
  workflowId: z.string().optional(),
});

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  // n8n からのタスク完了コールバック
  app.post('/n8n/task-complete', async (request, reply) => {
    const authToken = request.headers['x-webhook-token'];
    if (authToken !== WEBHOOK_AUTH_TOKEN) {
      return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: '認証トークンが無効です' } });
    }

    const result = taskCompleteSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: result.error.message } });
    }

    const { taskId, status, output, error, workflowId } = result.data;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'タスクが見つかりません' } });
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        output: output ?? null,
        lastError: error ?? null,
        n8nWorkflowId: workflowId ?? null,
        executedAt: new Date(),
      },
    });

    // 完了ログ追加
    await prisma.taskLog.create({
      data: {
        taskId,
        message: status === 'DONE'
          ? `n8n ワークフロー完了: タスクが正常に実行されました`
          : `n8n ワークフロー失敗: ${error ?? '不明なエラー'}`,
        level: status === 'DONE' ? 'INFO' : 'ERROR',
      },
    });

    return reply.send({ success: true, data: updated });
  });

  // n8n からの進捗ログ追加
  app.post('/n8n/task-log', async (request, reply) => {
    const authToken = request.headers['x-webhook-token'];
    if (authToken !== WEBHOOK_AUTH_TOKEN) {
      return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: '認証トークンが無効です' } });
    }

    const schema = z.object({
      taskId: z.string(),
      message: z.string(),
      level: z.enum(['INFO', 'WARN', 'ERROR']).default('INFO'),
    });

    const result = schema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: result.error.message } });
    }

    const log = await prisma.taskLog.create({
      data: {
        taskId: result.data.taskId,
        message: result.data.message,
        level: result.data.level,
      },
    });

    return reply.code(201).send({ success: true, data: log });
  });

  // QUEUEDタスク一覧（n8n ポーリング用）
  app.get('/n8n/queued-tasks', async (request, reply) => {
    const authToken = request.headers['x-webhook-token'];
    if (authToken !== WEBHOOK_AUTH_TOKEN) {
      return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: '認証トークンが無効です' } });
    }

    const tasks = await prisma.task.findMany({
      where: { status: 'QUEUED' },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    return reply.send({ success: true, data: tasks });
  });
}
