-- AlterTable
ALTER TABLE `sale_items` DROP COLUMN `discount`;
ALTER TABLE `sale_items` DROP COLUMN `discountType`;
ALTER TABLE `sale_items` DROP COLUMN `discounts`;

-- CreateTable
CREATE TABLE `discounts` (
    `id` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `type` ENUM('PERCENTAGE', 'VALUE') NOT NULL,
    `origin` ENUM('COUPON', 'PLAN', 'VALUE') NOT NULL,
    `order` INTEGER NOT NULL,
    `saleItemId` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `discount_saleItemId_idx`(`saleItemId`),
    CONSTRAINT `discount_saleItemId_fkey` FOREIGN KEY (`saleItemId`) REFERENCES `sale_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
