/*
  Warnings:

  - You are about to drop the column `unitId` on the `permissions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `permissions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `permissions` DROP FOREIGN KEY `permissions_unitId_fkey`;

-- DropIndex
DROP INDEX `permissions_unitId_fkey` ON `permissions`;

-- AlterTable
ALTER TABLE `permissions` DROP COLUMN `unitId`;

-- CreateIndex
CREATE UNIQUE INDEX `permissions_name_key` ON `permissions`(`name`);
