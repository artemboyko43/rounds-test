import { captureAppScreenshot } from './capture.js';
import { prisma } from '../db/prisma.js';

const DEFAULT_CAPTURE_INTERVAL_MINUTES = 60;
const MAX_CONCURRENT_CAPTURES = 2;
const SCHEDULER_CHECK_INTERVAL_MINUTES = 5;

const inProgressCaptures = new Set<number>();

const shouldCapture = async (appId: number, lastCaptureTime: Date | null, intervalMinutes: number | null): Promise<boolean> => {
  if (inProgressCaptures.has(appId)) {
    return false;
  }

  const interval = intervalMinutes ?? DEFAULT_CAPTURE_INTERVAL_MINUTES;
  const now = new Date();
  const nextCaptureTime = lastCaptureTime
    ? new Date(lastCaptureTime.getTime() + interval * 60 * 1000)
    : new Date(0);

  return now >= nextCaptureTime;
};

const processApp = async (appId: number) => {
  if (inProgressCaptures.has(appId)) {
    return;
  }

  inProgressCaptures.add(appId);

  try {
    await captureAppScreenshot(appId);
  } catch (error) {
    console.error(`Failed to capture screenshot for app ${appId}:`, error);
  } finally {
    inProgressCaptures.delete(appId);
  }
};

const runScheduler = async () => {
  if (inProgressCaptures.size >= MAX_CONCURRENT_CAPTURES) {
    return;
  }

  const activeApps = await prisma.trackedApp.findMany({
    where: { isActive: true },
    select: {
      id: true,
      captureIntervalMinutes: true,
    },
    orderBy: { id: 'asc' },
  });

  for (const app of activeApps) {
    if (inProgressCaptures.size >= MAX_CONCURRENT_CAPTURES) {
      break;
    }

    const lastScreenshot = await prisma.screenshot.findFirst({
      where: { trackedAppId: app.id, status: 'SUCCESS' },
      orderBy: { capturedAt: 'desc' },
      select: { capturedAt: true },
    });

    const needsCapture = await shouldCapture(
      app.id,
      lastScreenshot?.capturedAt ?? null,
      app.captureIntervalMinutes
    );

    if (needsCapture) {
      processApp(app.id).catch((error) => {
        console.error(`Error processing app ${app.id}:`, error);
      });
    }
  }
};

export const startScheduler = async () => {
  const cronExpression = `*/${SCHEDULER_CHECK_INTERVAL_MINUTES} * * * *`;
  
  const cron = await import('node-cron');
  
  cron.default.schedule(cronExpression, () => {
    runScheduler().catch((error) => {
      console.error('Scheduler error:', error);
    });
  });

  console.warn(`Scheduler started: checking every ${SCHEDULER_CHECK_INTERVAL_MINUTES} minutes`);
  
  runScheduler().catch((error) => {
    console.error('Initial scheduler run error:', error);
  });
};
