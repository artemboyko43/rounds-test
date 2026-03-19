import type { ScreenshotItem } from './types';
import { apiGet } from './client';

export async function getAppScreenshots(
  appId: number,
  limit: number,
  cursor?: number | null
): Promise<{ items: ScreenshotItem[]; nextCursor: number | null }> {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (cursor !== undefined && cursor !== null) {
    qs.set('cursor', String(cursor));
  }
  return apiGet(`/api/apps/${appId}/screenshots?${qs.toString()}`);
}
