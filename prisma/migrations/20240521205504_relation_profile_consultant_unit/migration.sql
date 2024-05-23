-- AlterTable
ALTER TABLE `units` ADD COLUMN `consultantId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `units` ADD CONSTRAINT `units_consultantId_fkey` FOREIGN KEY (`consultantId`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
