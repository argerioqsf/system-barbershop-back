-- AlterTable
ALTER TABLE `profiles` MODIFY `role` ENUM('administrator', 'consultant', 'indicator', 'coordinator', 'financial', 'secretary') NOT NULL DEFAULT 'indicator';
