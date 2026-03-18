import type { TrackedApp } from './types';
import { apiGet } from './client';

export async function getApps(): Promise<{ items: TrackedApp[] }> {
  return apiGet('/api/apps');
}
