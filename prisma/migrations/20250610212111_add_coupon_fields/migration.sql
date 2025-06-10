-- Add discountType field to coupons and couponId to sales
ALTER TABLE `coupons` ADD COLUMN `discountType` ENUM('PERCENTAGE','VALUE') NOT NULL DEFAULT 'PERCENTAGE';
ALTER TABLE `sales` ADD COLUMN `couponId` VARCHAR(191);
ALTER TABLE `sales` ADD CONSTRAINT `sales_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
