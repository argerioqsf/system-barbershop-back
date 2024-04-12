-- DropForeignKey
ALTER TABLE `leads` DROP FOREIGN KEY `leads_consultantId_fkey`;

-- AlterTable
ALTER TABLE `leads` MODIFY `consultantId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_consultantId_fkey` FOREIGN KEY (`consultantId`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
