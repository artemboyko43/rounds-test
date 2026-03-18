import Fastify from 'fastify';

const buildServer = () => {
  const app = Fastify({
    logger: true,
  });

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  return app;
};

const start = async () => {
  const port = Number(process.env.PORT ?? 4000);
  const host = '0.0.0.0';

  const app = buildServer();
  await app.listen({ port, host });
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
