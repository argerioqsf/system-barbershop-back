-- DropForeignKey
ALTER TABLE `course_segment` DROP FOREIGN KEY `course_segment_segmentId_fkey`;

-- DropForeignKey
ALTER TABLE `unit_segment` DROP FOREIGN KEY `unit_segment_segmentId_fkey`;

-- AddForeignKey
ALTER TABLE `unit_segment` ADD CONSTRAINT `unit_segment_segmentId_fkey` FOREIGN KEY (`segmentId`) REFERENCES `segments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_segment` ADD CONSTRAINT `course_segment_segmentId_fkey` FOREIGN KEY (`segmentId`) REFERENCES `segments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
