/*
  Warnings:

  - Added the required column `unitId` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `plans` ADD COLUMN `unitId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `plans` ADD CONSTRAINT `plans_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
