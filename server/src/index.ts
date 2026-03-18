import Fastify from 'fastify';
import { registerAppsRoutes } from './routes/apps.js';
import { registerScreenshotsRoutes } from './routes/screenshots.js';
import cors from '@fastify/cors';
import { startScheduler } from './services/scheduler.js';

const buildServer = () => {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, {
    origin: true,
  });

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  registerAppsRoutes(app);
  registerScreenshotsRoutes(app);

  return app;
};

const start = async () => {
  const port = Number(process.env.PORT ?? 4000);
  const host = '0.0.0.0';

  const app = buildServer();
  await app.listen({ port, host });

  if (process.env.DISABLE_SCHEDULER !== 'true') {
    await startScheduler();
  }
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
