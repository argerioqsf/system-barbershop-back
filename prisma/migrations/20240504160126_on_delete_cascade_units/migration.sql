-- DropForeignKey
ALTER TABLE `unit_courses` DROP FOREIGN KEY `unit_courses_unitId_fkey`;

-- DropForeignKey
ALTER TABLE `unit_segment` DROP FOREIGN KEY `unit_segment_unitId_fkey`;

-- AddForeignKey
ALTER TABLE `unit_segment` ADD CONSTRAINT `unit_segment_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit_courses` ADD CONSTRAINT `unit_courses_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
