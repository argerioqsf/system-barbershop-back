-- AlterTable
ALTER TABLE `services` DROP COLUMN `category`, ADD COLUMN `categoryId` VARCHAR(191) NULL;
ALTER TABLE `products` ADD COLUMN `categoryId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `category_services`;
DROP TABLE `category_products`;

-- AddForeignKey
ALTER TABLE `services` ADD CONSTRAINT `services_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
