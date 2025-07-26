-- DropForeignKey
ALTER TABLE `discounts` DROP FOREIGN KEY `discount_saleItemId_fkey`;

-- AddForeignKey
ALTER TABLE `discounts` ADD CONSTRAINT `discounts_saleItemId_fkey` FOREIGN KEY (`saleItemId`) REFERENCES `sale_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `discounts` RENAME INDEX `discount_saleItemId_idx` TO `discounts_saleItemId_idx`;
