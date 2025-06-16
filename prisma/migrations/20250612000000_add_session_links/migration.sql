-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `cashRegisterSessionId` VARCHAR(191);

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_cashRegisterSessionId_fkey` FOREIGN KEY (`cashRegisterSessionId`) REFERENCES `cash_register_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `sales` ADD COLUMN `sessionId` VARCHAR(191);

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `cash_register_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
