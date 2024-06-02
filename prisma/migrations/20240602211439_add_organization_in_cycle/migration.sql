/*
  Warnings:

  - You are about to drop the column `cicleId` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the `Cycle` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `leads` DROP FOREIGN KEY `leads_cicleId_fkey`;

-- AlterTable
ALTER TABLE `leads` DROP COLUMN `cicleId`,
    ADD COLUMN `cycleId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `Cycle`;

-- CreateTable
CREATE TABLE `cycle` (
    `id` VARCHAR(191) NOT NULL,
    `start_cycle` DATETIME(3) NOT NULL,
    `end_cycle` DATETIME(3) NULL,
    `organizationId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `cycle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cycle` ADD CONSTRAINT `cycle_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
