/*
  Warnings:

  - You are about to drop the `MonitoringSource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `PipelineEntry` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `PipelineEntry` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `value` on the `PipelineEntry` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - The primary key for the `Tender` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `dueDate` on the `Tender` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `Tender` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `value` on the `Tender` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MonitoringSource";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PipelineEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_PipelineEntry" ("id", "stage", "title", "value") SELECT "id", "stage", "title", "value" FROM "PipelineEntry";
DROP TABLE "PipelineEntry";
ALTER TABLE "new_PipelineEntry" RENAME TO "PipelineEntry";
CREATE TABLE "new_Tender" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "manualReview" BOOLEAN NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Tender" ("createdAt", "id", "manualReview", "priority", "region", "status", "title", "trade", "value") SELECT "createdAt", "id", "manualReview", "priority", "region", "status", "title", "trade", "value" FROM "Tender";
DROP TABLE "Tender";
ALTER TABLE "new_Tender" RENAME TO "Tender";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
