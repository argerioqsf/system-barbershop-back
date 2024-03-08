/*
  Warnings:

  - Added the required column `courseId` to the `segments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `segments` ADD COLUMN `courseId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `segments` ADD CONSTRAINT `segments_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
