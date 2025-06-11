-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `saleId` VARCHAR(191);

-- CreateIndex
CREATE UNIQUE INDEX `transactions_saleId_key` ON `transactions`(`saleId`);

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `sales` ADD COLUMN `transactionId` VARCHAR(191);

-- CreateIndex
CREATE UNIQUE INDEX `sales_transactionId_key` ON `sales`(`transactionId`);

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `sale_items` ADD COLUMN `barberId` VARCHAR(191);
ALTER TABLE `sale_items` ADD COLUMN `couponId` VARCHAR(191);
ALTER TABLE `sale_items` ADD COLUMN `total` DOUBLE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_barberId_fkey` FOREIGN KEY (`barberId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
