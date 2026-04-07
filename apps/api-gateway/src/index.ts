import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
import { authRoutes } from './routes/auth';
import { chatRoutes } from './routes/chat';
import { governanceRoutes } from './routes/governance';
import { fileRoutes } from './routes/files';
import { taskRoutes } from './routes/tasks';
import { webhookRoutes } from './routes/webhooks';
import { agentRoutes } from './routes/agents';

const app = Fastify({ logger: true });

async function start(): Promise<void> {
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000').split(',');
  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'fallback-secret-change-in-production',
  });

  await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB
  await app.register(websocket);

  app.get('/health', async () => ({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }));

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(chatRoutes, { prefix: '/api/chat' });
  await app.register(governanceRoutes, { prefix: '/api/governance' });
  await app.register(fileRoutes, { prefix: '/api/files' });
  await app.register(taskRoutes, { prefix: '/api/tasks' });
  await app.register(webhookRoutes, { prefix: '/api/webhooks' });
  await app.register(agentRoutes, { prefix: '/api/agents' });

  const port = parseInt(process.env.PORT ?? '4000');
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`API Gateway running on port ${port}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
