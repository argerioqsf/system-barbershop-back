/*
  Warnings:

  - You are about to drop the column `unitId` on the `profiles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `profiles` DROP FOREIGN KEY `profiles_unitId_fkey`;

-- AlterTable
ALTER TABLE `profiles` DROP COLUMN `unitId`;

-- CreateTable
CREATE TABLE `unit_consultant` (
    `consultantId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`consultantId`, `unitId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `unit_consultant` ADD CONSTRAINT `unit_consultant_consultantId_fkey` FOREIGN KEY (`consultantId`) REFERENCES `profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit_consultant` ADD CONSTRAINT `unit_consultant_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
