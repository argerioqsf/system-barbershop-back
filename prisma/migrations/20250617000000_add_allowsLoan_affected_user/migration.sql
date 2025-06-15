-- AlterTable
ALTER TABLE `units` ADD COLUMN `allowsLoan` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `affectedUserId` VARCHAR(191);

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_affectedUserId_fkey` FOREIGN KEY (`affectedUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
