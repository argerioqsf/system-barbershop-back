-- AlterEnum
ALTER TABLE `profiles` MODIFY `role` ENUM('ADMIN', 'BARBER', 'CLIENT', 'ATTENDANT', 'MANAGER', 'OWNER') NOT NULL DEFAULT 'CLIENT';

-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `receiptUrl` VARCHAR(191);
