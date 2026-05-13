import { prisma } from '../utils/prisma';

const N8N_URL = process.env.N8N_CLOUD_URL ?? process.env.N8N_URL ?? 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY ?? '';

const DEPT_WORKFLOW_IDS: Record<string, string> = {
  SALES: process.env.N8N_WORKFLOW_ID_SALES ?? '',
  MARKETING: process.env.N8N_WORKFLOW_ID_MARKETING ?? '',
  ACCOUNTING: process.env.N8N_WORKFLOW_ID_ACCOUNTING ?? '',
  ANALYTICS: process.env.N8N_WORKFLOW_ID_ANALYTICS ?? '',
  GENERAL: process.env.N8N_WORKFLOW_ID_GENERAL ?? '',
};
const N8N_WORKFLOW_ID_FALLBACK = process.env.N8N_WORKFLOW_ID ?? '';

const DEPT_WORKFLOW_NAMES: Record<string, string> = {
  SALES: 'org-ai Dept Sales',
  MARKETING: 'org-ai Dept Marketing',
  ACCOUNTING: 'org-ai Dept Accounting',
  ANALYTICS: 'org-ai Dept Analytics',
  GENERAL: 'org-ai Dept General',
};

const cachedWorkflowIds = new Map<string, string>();

export async function resolveWorkflowIdForDept(department: string): Promise<string | null> {
  const cached = cachedWorkflowIds.get(department);
  if (cached) return cached;

  const envId = DEPT_WORKFLOW_IDS[department];
  if (envId) {
    cachedWorkflowIds.set(department, envId);
    return envId;
  }

  if (N8N_API_KEY) {
    try {
      const res = await fetch(`${N8N_URL}/api/v1/workflows`, {
        headers: { 'X-N8N-API-KEY': N8N_API_KEY },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: { id: string; name: string }[] };
        const targetName = DEPT_WORKFLOW_NAMES[department];
        const wf = json.data.find((w) => w.name === targetName);
        if (wf) {
          cachedWorkflowIds.set(department, wf.id);
          return wf.id;
        }
      }
    } catch (e) {
      console.error(`[n8n] resolveWorkflowIdForDept(${department}) failed:`, e);
    }
  }

  if (N8N_WORKFLOW_ID_FALLBACK) {
    return N8N_WORKFLOW_ID_FALLBACK;
  }
  return null;
}

export async function triggerN8nWorkflow(task: {
  id: string;
  orgId: string;
  title: string;
  input: string;
  department: string;
  taskType?: string | null;
}): Promise<void> {
  const workflowId = await resolveWorkflowIdForDept(task.department);
  if (!workflowId) {
    console.warn(`[n8n] workflow id not resolved for ${task.department} — skipping trigger`);
    return;
  }
  const org = await prisma.organization.findUnique({
    where: { id: task.orgId },
    select: { plan: true },
  });
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (N8N_API_KEY) headers['X-N8N-API-KEY'] = N8N_API_KEY;
    const res = await fetch(`${N8N_URL}/api/v1/workflows/${workflowId}/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        startNodes: [],
        runData: {
          taskId: task.id,
          orgId: task.orgId,
          title: task.title,
          input: task.input,
          department: task.department,
          taskType: task.taskType ?? null,
          plan: org?.plan ?? 'STARTER',
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
      const json = (await res.json()) as { data: { executionId: string } };
      console.log(`[n8n] workflow started, executionId=${json.data?.executionId}`);
    }
  } catch (e) {
    console.error('[n8n] trigger failed:', e);
  }
}

export async function executeTaskViaAiEngine(task: {
  id: string;
  orgId: string;
  title: string;
  input: string;
  department: string;
}): Promise<void> {
  const aiEngineUrl = process.env.AI_ENGINE_URL ?? 'http://localhost:8000';
  const org = await prisma.organization.findUnique({
    where: { id: task.orgId },
    select: { plan: true },
  });
  try {
    await prisma.taskLog.create({
      data: { taskId: task.id, message: 'AI Engineで直接実行を開始', level: 'INFO' },
    });
    const res = await fetch(`${aiEngineUrl}/orchestrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: task.input,
        org_id: task.orgId,
        session_id: task.id,
        department: task.department,
        plan: org?.plan ?? 'STARTER',
      }),
    });
    if (!res.ok) throw new Error(`AI Engine returned ${res.status}`);
    const result = (await res.json()) as { content: string; department: string };
    await prisma.task.update({
      where: { id: task.id },
      data: { status: 'DONE', output: result.content, executedAt: new Date() },
    });
    await prisma.taskLog.create({
      data: { taskId: task.id, message: 'AI Engineで実行完了', level: 'INFO' },
    });
  } catch (e) {
    console.error('[ai-engine-fallback] failed:', e);
    await prisma.task.update({
      where: { id: task.id },
      data: { status: 'FAILED', lastError: String(e) },
    });
    await prisma.taskLog.create({
      data: { taskId: task.id, message: `実行失敗: ${String(e)}`, level: 'ERROR' },
    });
  }
}

/** QUEUED 状態の Task を n8n もしくは AI Engine で発火する共通エントリ */
export async function dispatchQueuedTask(task: {
  id: string;
  orgId: string;
  title: string;
  input: string;
  department: string;
  taskType?: string | null;
}): Promise<void> {
  const workflowId = await resolveWorkflowIdForDept(task.department);
  if (workflowId) {
    await triggerN8nWorkflow(task);
  } else {
    await executeTaskViaAiEngine(task);
  }
}
