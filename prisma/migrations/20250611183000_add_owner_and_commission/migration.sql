-- AlterEnum
ALTER TABLE `profiles` MODIFY `role` ENUM('ADMIN', 'BARBER', 'CLIENT', 'ATTENDANT', 'OWNER') NOT NULL DEFAULT 'CLIENT';

-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `commissionPercentage` DOUBLE NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE `coupons` ADD COLUMN `quantity` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `organizations` ADD COLUMN `ownerId` VARCHAR(191);

-- AddForeignKey
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
