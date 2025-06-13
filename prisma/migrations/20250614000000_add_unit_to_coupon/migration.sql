-- AlterTable
ALTER TABLE `coupons` ADD COLUMN `unitId` VARCHAR(191);

-- AddForeignKey
ALTER TABLE `coupons` ADD CONSTRAINT `coupons_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
