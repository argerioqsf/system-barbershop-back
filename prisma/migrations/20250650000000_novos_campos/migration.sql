-- AlterTable
ALTER TABLE `appointment_services` ADD COLUMN `commissionPaid` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `sale_items` ADD COLUMN `commissionPaid` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `appointmentServiceId` VARCHAR(191) NULL,
    ADD COLUMN `saleItemId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_saleItemId_fkey` FOREIGN KEY (`saleItemId`) REFERENCES `sale_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_appointmentServiceId_fkey` FOREIGN KEY (`appointmentServiceId`) REFERENCES `appointment_services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
