/*
  Warnings:

  - Added the required column `coursesId` to the `segments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `segments` ADD COLUMN `coursesId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `segments` ADD CONSTRAINT `segments_coursesId_fkey` FOREIGN KEY (`coursesId`) REFERENCES `courses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
