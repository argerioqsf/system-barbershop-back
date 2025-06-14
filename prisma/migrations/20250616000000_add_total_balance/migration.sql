-- AlterTable
ALTER TABLE `units` ADD COLUMN `totalBalance` DOUBLE NOT NULL DEFAULT 0;
ALTER TABLE `organizations` ADD COLUMN `totalBalance` DOUBLE NOT NULL DEFAULT 0;
