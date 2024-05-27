-- DropForeignKey
ALTER TABLE `profiles` DROP FOREIGN KEY `profiles_unitId_fkey`;

-- AlterTable
ALTER TABLE `profiles` MODIFY `unitId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
