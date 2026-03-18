import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { prisma } from '../db/prisma.js';

const storageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../storage/screenshots'
);

const makeImageFileName = (trackedAppId: number) => {
  const now = Date.now();
  return `${trackedAppId}_${now}.png`;
};

const ensureDir = async (dir: string) => {
  await fs.promises.mkdir(dir, { recursive: true });
};

const sanitizeError = (e: unknown) => {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return 'Unknown error';
  }
};

export const captureAppScreenshot = async (trackedAppId: number) => {
  const app = await prisma.trackedApp.findUnique({
    where: { id: trackedAppId },
    select: { id: true, url: true },
  });

  if (!app) {
    throw new Error('Tracked app not found');
  }

  await ensureDir(storageRoot);
  const fileName = makeImageFileName(trackedAppId);
  const fullPath = path.resolve(storageRoot, fileName);

  let status: 'SUCCESS' | 'FAILED' = 'FAILED';
  let error: string | null = null;

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();
  try {
    await page.goto(app.url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page
      .waitForLoadState('networkidle', { timeout: 30000 })
      .catch(() => undefined);

    await page.screenshot({
      path: fullPath,
      fullPage: true,
    });

    status = 'SUCCESS';
  } catch (e) {
    error = sanitizeError(e);
    try {
      await page.screenshot({
        path: fullPath,
        fullPage: true,
      });
    } catch {
      // If screenshot fails completely, we still want to persist the error.
    }
  } finally {
    await page.close().catch(() => undefined);
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }

  try {
    const stat = await fs.promises.stat(fullPath);
    if (!stat || stat.size <= 0) {
      status = 'FAILED';
      error ??= 'Screenshot file was empty';
    }
  } catch (e) {
    status = 'FAILED';
    error ??= sanitizeError(e);
  }

  return prisma.screenshot.create({
    data: {
      trackedAppId,
      imagePath: fileName,
      status,
      error,
    },
  });
};
