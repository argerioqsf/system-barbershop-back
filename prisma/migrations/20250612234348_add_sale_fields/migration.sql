-- AlterTable
ALTER TABLE `sales` ADD COLUMN `clientId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `sale_items` ADD COLUMN `discount` DOUBLE NULL,
    ADD COLUMN `discountType` ENUM('PERCENTAGE', 'VALUE') NULL,
    ADD COLUMN `porcentagemBarbeiro` DOUBLE NULL,
    MODIFY `price` DOUBLE NOT NULL;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

