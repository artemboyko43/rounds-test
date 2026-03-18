import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { captureAppScreenshot } from '../services/capture.js';

const createAppBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  packageId: z.string().min(1).max(200).optional(),
  url: z.string().url().max(2000),
  captureIntervalMinutes: z.number().int().positive().optional(),
});

const updateAppBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  packageId: z.string().min(1).max(200).optional(),
  url: z.string().url().max(2000).optional(),
  captureIntervalMinutes: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

type Body = z.infer<typeof createAppBodySchema>;
type UpdateBody = z.infer<typeof updateAppBodySchema>;

const inProgressCaptures = new Map<number, Promise<unknown>>();

const timelineQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
  cursor: z.coerce.number().int().positive().optional(),
});

export const registerAppsRoutes = (app: FastifyInstance) => {
  app.get('/api/apps', async () => {
    const items = await prisma.trackedApp.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return { items };
  });

  app.post(
    '/api/apps',
    async (
      req: FastifyRequest,
      reply: FastifyReply
    ): Promise<{ id: number } | { error: string }> => {
      const parsed = createAppBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.message });
      }

      const body: Body = parsed.data;
      const created = await prisma.trackedApp.create({
        data: {
          name: body.name,
          packageId: body.packageId,
          url: body.url,
          captureIntervalMinutes: body.captureIntervalMinutes,
          isActive: true,
        },
        select: { id: true },
      });

      return reply.send(created);
    }
  );

  app.put(
    '/api/apps/:id',
    async (
      req: FastifyRequest,
      reply: FastifyReply
    ): Promise<{ id: number } | { error: string }> => {
      const id = Number((req.params as { id?: string }).id);
      if (!Number.isInteger(id) || id <= 0) {
        return reply.status(400).send({ error: 'Invalid id' });
      }

      const parsed = updateAppBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.message });
      }

      const update: UpdateBody = parsed.data;

      const existing = await prisma.trackedApp.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!existing) {
        return reply.status(404).send({ error: 'Not found' });
      }

      await prisma.trackedApp.update({
        where: { id },
        data: {
          name: update.name,
          packageId: update.packageId,
          url: update.url,
          captureIntervalMinutes: update.captureIntervalMinutes,
          isActive: update.isActive,
        },
      });

      return reply.send({ id });
    }
  );

  app.delete(
    '/api/apps/:id',
    async (
      req: FastifyRequest,
      reply: FastifyReply
    ): Promise<{ id: number; isActive: boolean } | { error: string }> => {
      const id = Number((req.params as { id?: string }).id);
      if (!Number.isInteger(id) || id <= 0) {
        return reply.status(400).send({ error: 'Invalid id' });
      }

      const existing = await prisma.trackedApp.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!existing) {
        return reply.status(404).send({ error: 'Not found' });
      }

      const updated = await prisma.trackedApp.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, isActive: true },
      });

      return reply.send(updated);
    }
  );

  app.get(
    '/api/apps/:id/screenshots',
    async (
      req: FastifyRequest,
      reply: FastifyReply
    ): Promise<
      | { items: { id: number; capturedAt: string; imageUrl: string; status: string }[]; nextCursor: number | null }
      | { error: string }
    > => {
      const id = Number((req.params as { id?: string }).id);
      if (!Number.isInteger(id) || id <= 0) {
        return reply.status(400).send({ error: 'Invalid id' });
      }

      const parsed = timelineQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.message });
      }

      const limit = parsed.data.limit ?? 20;
      const cursor = parsed.data.cursor;

      const exists = await prisma.trackedApp.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!exists) {
        return reply.status(404).send({ error: 'Not found' });
      }

      const screenshots = await prisma.screenshot.findMany({
        where: { trackedAppId: id },
        orderBy: [{ capturedAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        select: { id: true, capturedAt: true, imagePath: true, status: true },
      });

      const items = screenshots.slice(0, limit).map((s) => ({
        id: s.id,
        capturedAt: s.capturedAt.toISOString(),
        imageUrl: `/api/screenshots/${s.id}/file`,
        status: s.status,
      }));

      let nextCursor: number | null = null;
      if (items.length === limit) {
        nextCursor = items.at(-1)?.id ?? null;
      }

      return reply.send({ items, nextCursor });
    }
  );

  app.post(
    '/api/apps/:id/capture',
    async (
      req: FastifyRequest,
      reply: FastifyReply
    ): Promise<{ screenshotId: number } | { error: string }> => {
      const id = Number((req.params as { id?: string }).id);
      if (!Number.isInteger(id) || id <= 0) {
        return reply.status(400).send({ error: 'Invalid id' });
      }

      const existing = await prisma.trackedApp.findUnique({
        where: { id },
        select: { id: true, isActive: true },
      });
      if (!existing || !existing.isActive) {
        return reply.status(404).send({ error: 'Not found' });
      }

      if (inProgressCaptures.has(id)) {
        return reply.status(409).send({ error: 'Capture already in progress' });
      }

      const job = captureAppScreenshot(id)
        .then((shot) => {
          return { screenshotId: shot.id };
        })
        .finally(() => {
          inProgressCaptures.delete(id);
        });

      inProgressCaptures.set(id, job);
      const result = await job;
      return reply.send(result);
    }
  );
};
