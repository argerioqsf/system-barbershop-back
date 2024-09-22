-- AlterTable
ALTER TABLE `leads` ADD COLUMN `released` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `profiles` MODIFY `role` ENUM('administrator', 'consultant', 'indicator', 'coordinator', 'financial', 'secretary', 'auxiliary') NOT NULL DEFAULT 'indicator';
