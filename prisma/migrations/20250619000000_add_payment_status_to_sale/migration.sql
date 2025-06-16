-- AlterTable
ALTER TABLE `sales` ADD COLUMN `paymentStatus` ENUM('PAID', 'PENDING') NOT NULL DEFAULT 'PAID';
ALTER TABLE `sales` DROP FOREIGN KEY `sales_transactionId_fkey`;
ALTER TABLE `sales` MODIFY `transactionId` VARCHAR(191) NULL;
ALTER TABLE `sales` ADD CONSTRAINT `sales_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
