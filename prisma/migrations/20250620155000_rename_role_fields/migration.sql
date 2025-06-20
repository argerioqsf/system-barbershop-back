-- Rename roleModelId to roleId and drop role column on profiles
ALTER TABLE `profiles` DROP FOREIGN KEY `profiles_roleModelId_fkey`;
ALTER TABLE `profiles` CHANGE `roleModelId` `roleId` VARCHAR(191) NOT NULL;
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `profiles` DROP COLUMN `role`;
