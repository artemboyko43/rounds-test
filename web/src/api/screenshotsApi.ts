import type { ScreenshotItem } from './types';
import { apiGet } from './client';

export async function getAppScreenshots(
  appId: number,
  limit: number
): Promise<{ items: ScreenshotItem[]; nextCursor: number | null }> {
  const qs = new URLSearchParams({ limit: String(limit) });
  return apiGet(`/api/apps/${appId}/screenshots?${qs.toString()}`);
}
