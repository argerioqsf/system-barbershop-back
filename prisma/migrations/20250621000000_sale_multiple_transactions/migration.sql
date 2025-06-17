-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `saleId` VARCHAR(191);

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `sales` DROP FOREIGN KEY `sales_transactionId_fkey`;
ALTER TABLE `sales` DROP INDEX `sales_transactionId_key`;
ALTER TABLE `sales` DROP COLUMN `transactionId`;
