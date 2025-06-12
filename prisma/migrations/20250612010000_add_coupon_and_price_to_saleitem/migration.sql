-- AlterTable
ALTER TABLE `sale_items` ADD COLUMN `couponId` VARCHAR(191);
ALTER TABLE `sale_items` ADD COLUMN `price` DOUBLE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
