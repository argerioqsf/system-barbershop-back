-- AlterTable
ALTER TABLE `sales` ADD COLUMN `transactionId` VARCHAR(191) NOT NULL;
ALTER TABLE `sales` ADD CONSTRAINT `sales_transactionId_key` UNIQUE (`transactionId`);

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
