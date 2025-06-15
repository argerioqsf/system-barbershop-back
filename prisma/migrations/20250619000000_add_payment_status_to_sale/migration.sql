-- AlterTable
ALTER TABLE `sales` ADD COLUMN `paymentStatus` ENUM('PAID', 'PENDING') NOT NULL DEFAULT 'PAID';
ALTER TABLE `sales` MODIFY `transactionId` VARCHAR(191) NULL;
ALTER TABLE `sales` DROP INDEX `sales_transactionId_key`;
ALTER TABLE `sales` ADD CONSTRAINT `sales_transactionId_key` UNIQUE (`transactionId`);
