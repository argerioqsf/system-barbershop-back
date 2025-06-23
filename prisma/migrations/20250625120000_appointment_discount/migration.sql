-- AlterTable
ALTER TABLE `appointments` ADD COLUMN `discount` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `sales` DROP FOREIGN KEY `sales_appointmentId_fkey`;
ALTER TABLE `sales` DROP INDEX `sales_appointmentId_key`;
ALTER TABLE `sales` DROP COLUMN `appointmentId`;

-- AlterTable
ALTER TABLE `sale_items` ADD COLUMN `appointmentId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
