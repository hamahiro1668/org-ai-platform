import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth } from '../middleware/auth';

const DEPARTMENTS = ['SALES', 'MARKETING', 'ACCOUNTING', 'ANALYTICS', 'GENERAL'] as const;
const FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;

const createSchema = z.object({
  title: z.string().min(1).max(200),
  department: z.enum(DEPARTMENTS),
  taskType: z.string().min(1).max(50),
  input: z.string().min(1),
  recipientEmail: z.string().email().nullable().optional(),
  frequency: z.enum(FREQUENCIES),
  hourUtc: z.number().int().min(0).max(23),
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  enabled: z.boolean().default(true),
});

const updateSchema = createSchema.partial();

export async function scheduledTaskRoutes(app: FastifyInstance): Promise<void> {
  // 一覧
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as { orgId: string };
    const tasks = await prisma.scheduledTask.findMany({
      where: { orgId: payload.orgId },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ success: true, data: tasks });
  });

  // 作成
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as { orgId: string };
    const result = createSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: result.error.message },
      });
    }
    const data = result.data;

    // weekly なら dayOfWeek、monthly なら dayOfMonth を要求
    if (data.frequency === 'weekly' && data.dayOfWeek == null) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'weekly には dayOfWeek (0-6) が必要です' },
      });
    }
    if (data.frequency === 'monthly' && data.dayOfMonth == null) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'monthly には dayOfMonth (1-31) が必要です' },
      });
    }

    const created = await prisma.scheduledTask.create({
      data: {
        orgId: payload.orgId,
        title: data.title,
        department: data.department,
        taskType: data.taskType,
        input: data.input,
        recipientEmail: data.recipientEmail ?? null,
        frequency: data.frequency,
        hourUtc: data.hourUtc,
        dayOfWeek: data.dayOfWeek ?? null,
        dayOfMonth: data.dayOfMonth ?? null,
        enabled: data.enabled,
      },
    });
    return reply.code(201).send({ success: true, data: created });
  });

  // 更新
  app.patch('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const payload = request.user as { orgId: string };
    const existing = await prisma.scheduledTask.findUnique({ where: { id } });
    if (!existing || existing.orgId !== payload.orgId) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '定期タスクが見つかりません' },
      });
    }

    const result = updateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: result.error.message },
      });
    }

    const updated = await prisma.scheduledTask.update({
      where: { id },
      data: result.data,
    });
    return reply.send({ success: true, data: updated });
  });

  // 削除
  app.delete('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const payload = request.user as { orgId: string };
    const existing = await prisma.scheduledTask.findUnique({ where: { id } });
    if (!existing || existing.orgId !== payload.orgId) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '定期タスクが見つかりません' },
      });
    }
    await prisma.scheduledTask.delete({ where: { id } });
    return reply.send({ success: true, data: { deleted: true } });
  });
}
