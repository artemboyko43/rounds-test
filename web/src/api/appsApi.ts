import type { TrackedApp } from './types';
import { apiGet, apiRequest } from './client';

export async function getApps(): Promise<{ items: TrackedApp[] }> {
  return apiGet('/api/apps');
}

export type CreateAppInput = {
  name?: string;
  packageId?: string;
  url: string;
  captureIntervalMinutes?: number;
};

export type UpdateAppInput = {
  name?: string;
  packageId?: string;
  url?: string;
  captureIntervalMinutes?: number;
  isActive?: boolean;
};

export async function createApp(input: CreateAppInput): Promise<{ id: number }> {
  return apiRequest('/api/apps', { method: 'POST', body: input });
}

export async function updateApp(id: number, input: UpdateAppInput): Promise<{ id: number }> {
  return apiRequest(`/api/apps/${id}`, { method: 'PUT', body: input });
}

export async function deactivateApp(
  id: number
): Promise<{ id: number; isActive: boolean }> {
  return apiRequest(`/api/apps/${id}`, { method: 'DELETE' });
}

export async function captureApp(id: number): Promise<{ screenshotId: number }> {
  return apiRequest(`/api/apps/${id}/capture`, { method: 'POST' });
}
