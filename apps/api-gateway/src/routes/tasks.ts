import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth } from '../middleware/auth';

// N8N_CLOUD_URL が設定されていればクラウドを優先
const N8N_URL = process.env.N8N_CLOUD_URL ?? process.env.N8N_URL ?? 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY ?? '';
const N8N_WORKFLOW_NAME = 'org-ai Task Execute';
// ローカルn8n用のワークフローIDを直接指定（API認証不要でフォールバック）
const N8N_WORKFLOW_ID = process.env.N8N_WORKFLOW_ID ?? '';

// n8n APIでワークフローIDをキャッシュ
let cachedWorkflowId: string | null = null;

/** n8n API: ワークフロー名でIDを検索 */
async function resolveWorkflowId(): Promise<string | null> {
  if (cachedWorkflowId) return cachedWorkflowId;

  // 環境変数で直接指定されている場合はAPIコール不要
  if (N8N_WORKFLOW_ID) {
    cachedWorkflowId = N8N_WORKFLOW_ID;
    console.log(`[n8n] using workflow id from env: ${N8N_WORKFLOW_ID}`);
    return cachedWorkflowId;
  }

  if (!N8N_API_KEY) return null;
  try {
    const res = await fetch(`${N8N_URL}/api/v1/workflows`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
    });
    if (!res.ok) return null;
    const json = await res.json() as { data: { id: string; name: string; active: boolean }[] };
    const wf = json.data.find((w) => w.name === N8N_WORKFLOW_NAME);
    if (wf) {
      cachedWorkflowId = wf.id;
      console.log(`[n8n] resolved workflow "${N8N_WORKFLOW_NAME}" → id=${wf.id}`);
    }
    return cachedWorkflowId;
  } catch (e) {
    console.error('[n8n] resolveWorkflowId failed:', e);
    return null;
  }
}

/** n8n API: ワークフローを実行 (POST /api/v1/workflows/:id/run) */
async function triggerN8nWorkflow(task: { id: string; orgId: string; title: string; input: string; department: string }) {
  const workflowId = await resolveWorkflowId();
  if (!workflowId) {
    console.warn('[n8n] workflow id not resolved — skipping trigger');
    return;
  }
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (N8N_API_KEY) headers['X-N8N-API-KEY'] = N8N_API_KEY;
    const res = await fetch(`${N8N_URL}/api/v1/workflows/${workflowId}/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        // n8n の "When Executed by Another Workflow" / Manual run に渡すデータ
        startNodes: [],
        runData: {
          taskId: task.id,
          orgId: task.orgId,
          title: task.title,
          input: task.input,
          department: task.department,
          callbackUrl: `${process.env.API_GATEWAY_URL ?? 'http://localhost:4000'}/api/webhooks/n8n/task-complete`,
          logUrl: `${process.env.API_GATEWAY_URL ?? 'http://localhost:4000'}/api/webhooks/n8n/task-log`,
          aiEngineUrl: process.env.AI_ENGINE_URL ?? 'http://localhost:8000',
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[n8n] run failed: ${res.status} ${body}`);
    } else {
      const json = await res.json() as { data: { executionId: string } };
      console.log(`[n8n] workflow started, executionId=${json.data?.executionId}`);
    }
  } catch (e) {
    console.error('[n8n] trigger failed:', e);
  }
}

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  department: z.string(),
  input: z.string(),
  status: z.string().default('PENDING'),
  taskType: z.string().optional(),
});

const approveTaskSchema = z.object({
  action: z.string().optional(),
  modifications: z.record(z.unknown()).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.string().optional(),
  output: z.string().optional(),
});

const addLogSchema = z.object({
  message: z.string().min(1),
  level: z.enum(['INFO', 'WARN', 'ERROR']).default('INFO'),
});

export async function taskRoutes(app: FastifyInstance): Promise<void> {
  // タスク一覧取得
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as { orgId: string };
    const query = request.query as { department?: string };
    const where: { orgId: string; department?: string } = { orgId: payload.orgId };
    if (query.department) where.department = query.department;
    const tasks = await prisma.task.findMany({
      where,
      include: { logs: { orderBy: { createdAt: 'asc' }, take: 20 } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ success: true, data: tasks });
  });

  // タスク単体取得
  app.get('/:taskId', { preHandler: requireAuth }, async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const payload = request.user as { orgId: string };
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { logs: { orderBy: { createdAt: 'asc' }, take: 50 } },
    });
    if (!task || task.orgId !== payload.orgId) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'タスクが見つかりません' } });
    }
    return reply.send({ success: true, data: task });
  });

  // タスク作成
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as { sub: string; orgId: string };
    const result = createTaskSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: result.error.message } });
    }
    const task = await prisma.task.create({
      data: {
        orgId: payload.orgId,
        title: result.data.title,
        department: result.data.department,
        input: result.data.input,
        status: result.data.status,
        taskType: result.data.taskType ?? null,
      },
    });
    // 作成ログ
    await prisma.taskLog.create({
      data: { taskId: task.id, message: `タスクを作成しました: ${task.title}`, level: 'INFO' },
    });

    // QUEUED状態で作成された場合、n8nを自動トリガー
    if (task.status === 'QUEUED') {
      triggerN8nWorkflow(task);
    }

    return reply.code(201).send({ success: true, data: task });
  });

  // タスク更新
  app.patch('/:taskId', { preHandler: requireAuth }, async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const payload = request.user as { orgId: string };

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.orgId !== payload.orgId) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'タスクが見つかりません' } });
    }

    const result = updateTaskSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: result.error.message } });
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: result.data,
    });

    if (result.data.status && result.data.status !== task.status) {
      await prisma.taskLog.create({
        data: { taskId, message: `ステータス変更: ${task.status} → ${result.data.status}`, level: 'INFO' },
      });
      // QUEUED になったら n8n をトリガー（fire-and-forget）
      if (result.data.status === 'QUEUED') {
        triggerN8nWorkflow(updated);
      }
    }

    return reply.send({ success: true, data: updated });
  });

  // タスク承認（PENDING_APPROVAL → QUEUED で実行フェーズをトリガー）
  app.post('/:taskId/approve', { preHandler: requireAuth }, async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const payload = request.user as { orgId: string };

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.orgId !== payload.orgId) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'タスクが見つかりません' } });
    }

    const body = approveTaskSchema.safeParse(request.body);
    const approvalData = body.success ? JSON.stringify(body.data) : null;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'QUEUED',
        approvalData,
      },
    });

    await prisma.taskLog.create({
      data: { taskId, message: `タスクを承認しました（${body.data?.action ?? '実行'}）`, level: 'INFO' },
    });

    // n8n をトリガーして実行フェーズ開始
    triggerN8nWorkflow(updated);

    return reply.send({ success: true, data: updated });
  });

  // タスク削除
  app.delete('/:taskId', { preHandler: requireAuth }, async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const payload = request.user as { orgId: string };

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.orgId !== payload.orgId) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'タスクが見つかりません' } });
    }

    await prisma.taskLog.deleteMany({ where: { taskId } });
    await prisma.task.delete({ where: { id: taskId } });
    return reply.send({ success: true, data: { deleted: true } });
  });

  // タスクログ追加
  app.post('/:taskId/logs', { preHandler: requireAuth }, async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const payload = request.user as { orgId: string };

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.orgId !== payload.orgId) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'タスクが見つかりません' } });
    }

    const result = addLogSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: result.error.message } });
    }

    const log = await prisma.taskLog.create({
      data: { taskId, message: result.data.message, level: result.data.level },
    });
    return reply.code(201).send({ success: true, data: log });
  });

  // WebSocket: タスクログのリアルタイム配信
  // WebSocketはブラウザAPIでヘッダーを送れないため、query paramでtoken認証する
  app.get('/:taskId/stream', { websocket: true }, async (socket, request) => {
    const { taskId } = request.params as { taskId: string };
    const { token } = request.query as { token?: string };

    // query param のトークンを検証
    let payload: { orgId: string };
    try {
      if (token) {
        payload = app.jwt.verify<{ orgId: string }>(token);
      } else {
        // Authorization ヘッダーにフォールバック
        await request.jwtVerify();
        payload = request.user as { orgId: string };
      }
    } catch {
      socket.send(JSON.stringify({ type: 'error', message: '認証エラー' }));
      socket.close();
      return;
    }

    // 接続確認メッセージ
    socket.send(JSON.stringify({ type: 'connected', taskId }));

    // ポーリングで新着ログを送信（5秒ごと）
    let lastLogId: string | null = null;
    const interval = setInterval(async () => {
      try {
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task || task.orgId !== payload.orgId) {
          socket.close();
          return;
        }

        const where = lastLogId
          ? { taskId, id: { gt: lastLogId } }
          : { taskId };

        const logs = await prisma.taskLog.findMany({
          where,
          orderBy: { createdAt: 'asc' },
          take: 50,
        });

        if (logs.length > 0) {
          lastLogId = logs[logs.length - 1].id;
          socket.send(JSON.stringify({ type: 'logs', data: logs }));
        }

        // タスク完了時は接続を閉じる
        if (task.status === 'DONE' || task.status === 'FAILED') {
          socket.send(JSON.stringify({ type: 'done', status: task.status }));
          clearInterval(interval);
          socket.close();
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);

    socket.on('close', () => clearInterval(interval));
  });
}
