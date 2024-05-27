/*
  Warnings:

  - You are about to drop the column `coursesId` on the `segments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `segments` DROP FOREIGN KEY `segments_coursesId_fkey`;

-- AlterTable
ALTER TABLE `segments` DROP COLUMN `coursesId`;

-- CreateTable
CREATE TABLE `course_segment` (
    `courseId` VARCHAR(191) NOT NULL,
    `segmentId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`segmentId`, `courseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `course_segment` ADD CONSTRAINT `course_segment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_segment` ADD CONSTRAINT `course_segment_segmentId_fkey` FOREIGN KEY (`segmentId`) REFERENCES `segments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
