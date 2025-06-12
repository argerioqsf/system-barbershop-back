-- AlterTable
ALTER TABLE `sale_items` ADD COLUMN `barberId` VARCHAR(191);

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_barberId_fkey` FOREIGN KEY (`barberId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
