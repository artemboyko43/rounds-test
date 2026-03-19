export type TrackedApp = {
  id: number;
  name: string | null;
  packageId: string | null;
  url: string;
  isActive: boolean;
  captureIntervalMinutes: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ScreenshotItem = {
  id: number;
  capturedAt: string;
  imageUrl: string;
  status: string;
};
