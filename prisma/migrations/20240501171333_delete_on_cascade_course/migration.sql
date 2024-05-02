-- DropForeignKey
ALTER TABLE `course_segment` DROP FOREIGN KEY `course_segment_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `timeline` DROP FOREIGN KEY `timeline_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `unit_courses` DROP FOREIGN KEY `unit_courses_courseId_fkey`;

-- AddForeignKey
ALTER TABLE `course_segment` ADD CONSTRAINT `course_segment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit_courses` ADD CONSTRAINT `unit_courses_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline` ADD CONSTRAINT `timeline_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
