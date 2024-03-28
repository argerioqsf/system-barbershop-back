/*
  Warnings:

  - You are about to drop the `Timeline` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UnitCourses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UnitSegment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Timeline` DROP FOREIGN KEY `Timeline_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `Timeline` DROP FOREIGN KEY `Timeline_leadsId_fkey`;

-- DropForeignKey
ALTER TABLE `UnitCourses` DROP FOREIGN KEY `UnitCourses_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `UnitCourses` DROP FOREIGN KEY `UnitCourses_unitId_fkey`;

-- DropForeignKey
ALTER TABLE `UnitSegment` DROP FOREIGN KEY `UnitSegment_segmentId_fkey`;

-- DropForeignKey
ALTER TABLE `UnitSegment` DROP FOREIGN KEY `UnitSegment_unitId_fkey`;

-- DropTable
DROP TABLE `Timeline`;

-- DropTable
DROP TABLE `UnitCourses`;

-- DropTable
DROP TABLE `UnitSegment`;

-- CreateTable
CREATE TABLE `unit_segment` (
    `segmentId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`segmentId`, `unitId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unit_courses` (
    `courseId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`courseId`, `unitId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timeline` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `leadsId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `unit_segment` ADD CONSTRAINT `unit_segment_segmentId_fkey` FOREIGN KEY (`segmentId`) REFERENCES `segments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit_segment` ADD CONSTRAINT `unit_segment_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit_courses` ADD CONSTRAINT `unit_courses_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit_courses` ADD CONSTRAINT `unit_courses_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline` ADD CONSTRAINT `timeline_leadsId_fkey` FOREIGN KEY (`leadsId`) REFERENCES `leads`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline` ADD CONSTRAINT `timeline_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
