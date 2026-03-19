import type { FastifyInstance, FastifyReply } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../db/prisma.js';
import { parseRouteId } from '../http/parseRouteId.js';

const storageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../storage/screenshots'
);

const getContentType = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
};

const resolveScreenshotPath = (imagePath: string) => {
  if (path.isAbsolute(imagePath)) throw new Error('Invalid imagePath');
  const normalized = path.normalize(imagePath);
  const fullPath = path.resolve(storageRoot, normalized);
  const prefix = `${storageRoot}${path.sep}`;
  if (!fullPath.startsWith(prefix)) throw new Error('Invalid imagePath');
  return fullPath;
};

export const registerScreenshotsRoutes = (app: FastifyInstance) => {
  app.get(
    '/api/screenshots/:id/file',
    async (req, reply: FastifyReply): Promise<void> => {
      const id = parseRouteId((req.params as { id?: string }).id);
      if (id === null) {
        reply.status(400).send({ error: 'Invalid id' });
        return;
      }

      const screenshot = await prisma.screenshot.findUnique({
        where: { id },
        select: { imagePath: true },
      });
      if (!screenshot) {
        reply.status(404).send({ error: 'Not found' });
        return;
      }

      let filePath: string;
      try {
        filePath = resolveScreenshotPath(screenshot.imagePath);
      } catch {
        reply.status(404).send({ error: 'Not found' });
        return;
      }

      try {
        const buf = await fs.promises.readFile(filePath);
        reply.header('content-type', getContentType(filePath));
        reply.send(buf);
      } catch {
        reply.status(404).send({ error: 'File not found' });
      }
    }
  );
};
