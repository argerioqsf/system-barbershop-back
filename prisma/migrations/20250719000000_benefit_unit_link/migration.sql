-- AlterTable
ALTER TABLE `benefits` ADD COLUMN `unitId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `benefits` ADD CONSTRAINT `benefits_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
