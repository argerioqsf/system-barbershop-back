/*
  Warnings:

  - Added the required column `segmentId` to the `timeline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitId` to the `timeline` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `timeline` ADD COLUMN `segmentId` VARCHAR(191) NOT NULL,
    ADD COLUMN `unitId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `timeline` ADD CONSTRAINT `timeline_segmentId_fkey` FOREIGN KEY (`segmentId`) REFERENCES `segments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline` ADD CONSTRAINT `timeline_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
