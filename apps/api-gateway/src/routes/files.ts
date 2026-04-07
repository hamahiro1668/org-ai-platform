import type { FastifyInstance } from 'fastify';
import { createWriteStream, createReadStream, existsSync } from 'fs';
import { mkdir, unlink } from 'fs/promises';
import { join, resolve, basename } from 'path';
import { pipeline } from 'stream/promises';
import { prisma } from '../utils/prisma';
import { requireAuth } from '../middleware/auth';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'image/png',
  'image/jpeg',
]);

const FILES_BASE = resolve(process.env.FILES_DIR ?? join(process.cwd(), '../../data/files'));

export async function fileRoutes(app: FastifyInstance): Promise<void> {
  app.post('/upload', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as { sub: string; orgId: string };
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ success: false, error: { code: 'NO_FILE', message: 'ファイルが選択されていません' } });
    }

    if (!ALLOWED_MIME_TYPES.has(data.mimetype)) {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_MIME', message: 'このファイル形式は許可されていません' } });
    }

    const orgDir = join(FILES_BASE, payload.orgId);
    await mkdir(orgDir, { recursive: true });

    const fileId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const safeName = basename(data.filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = join(orgDir, `${fileId}_${safeName}`);

    // パストラバーサル対策
    if (!resolve(storagePath).startsWith(resolve(FILES_BASE))) {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_PATH', message: '無効なファイルパスです' } });
    }

    await pipeline(data.file, createWriteStream(storagePath));

    const { size } = await import('fs').then((fs) => new Promise<{ size: number }>((ok, fail) =>
      fs.stat(storagePath, (err, s) => err ? fail(err) : ok(s))
    ));

    const file = await prisma.uploadedFile.create({
      data: {
        orgId: payload.orgId,
        uploadedBy: payload.sub,
        originalName: data.filename,
        storagePath,
        mimeType: data.mimetype,
        sizeBytes: size,
      },
    });

    return reply.code(201).send({ success: true, data: { id: file.id, originalName: file.originalName, mimeType: file.mimeType, sizeBytes: file.sizeBytes } });
  });

  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as { orgId: string };
    const files = await prisma.uploadedFile.findMany({
      where: { orgId: payload.orgId },
      select: { id: true, originalName: true, mimeType: true, sizeBytes: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ success: true, data: files });
  });

  app.get('/:fileId', { preHandler: requireAuth }, async (request, reply) => {
    const { fileId } = request.params as { fileId: string };
    const payload = request.user as { orgId: string };

    const file = await prisma.uploadedFile.findUnique({ where: { id: fileId } });
    if (!file || file.orgId !== payload.orgId) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'ファイルが見つかりません' } });
    }

    if (!existsSync(file.storagePath)) {
      return reply.code(404).send({ success: false, error: { code: 'FILE_MISSING', message: 'ファイルが見つかりません' } });
    }

    reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    reply.header('Content-Type', file.mimeType);
    return reply.send(createReadStream(file.storagePath));
  });

  app.delete('/:fileId', { preHandler: requireAuth }, async (request, reply) => {
    const { fileId } = request.params as { fileId: string };
    const payload = request.user as { orgId: string };

    const file = await prisma.uploadedFile.findUnique({ where: { id: fileId } });
    if (!file || file.orgId !== payload.orgId) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'ファイルが見つかりません' } });
    }

    await unlink(file.storagePath).catch(() => null);
    await prisma.uploadedFile.delete({ where: { id: fileId } });
    return reply.send({ success: true, data: { deleted: true } });
  });
}
