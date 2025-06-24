-- AlterTable
ALTER TABLE `appointments` ADD COLUMN `value` DOUBLE NULL;

-- AlterTable
ALTER TABLE `sale_items` ADD UNIQUE INDEX `sale_items_appointmentId_key`(`appointmentId`);
