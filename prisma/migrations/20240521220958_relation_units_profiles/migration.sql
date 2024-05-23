/*
  Warnings:

  - You are about to drop the column `consultantId` on the `units` table. All the data in the column will be lost.
  - Added the required column `unitId` to the `profiles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `units` DROP FOREIGN KEY `units_consultantId_fkey`;

-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `unitId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `units` DROP COLUMN `consultantId`;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
