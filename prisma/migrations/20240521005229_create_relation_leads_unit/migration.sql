/*
  Warnings:

  - Added the required column `unitId` to the `leads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `leads` ADD COLUMN `unitId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
