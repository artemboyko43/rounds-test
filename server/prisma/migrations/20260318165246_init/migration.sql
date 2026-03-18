-- CreateTable
CREATE TABLE "TrackedApp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "packageId" TEXT,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "captureIntervalMinutes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Screenshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trackedAppId" INTEGER NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imagePath" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    CONSTRAINT "Screenshot_trackedAppId_fkey" FOREIGN KEY ("trackedAppId") REFERENCES "TrackedApp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
