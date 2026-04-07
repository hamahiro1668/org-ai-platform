import type { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({
      success: false,
      error: { code: 'AUTH_REQUIRED', message: '認証が必要です' },
    });
  }
}

export async function requireOwner(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await requireAuth(request, reply);
  const user = request.user as { role: string };
  if (user.role !== 'OWNER') {
    reply.code(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'この操作にはOWNER権限が必要です' },
    });
  }
}
