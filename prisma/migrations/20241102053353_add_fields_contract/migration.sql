-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `contractLink` VARCHAR(191) NULL,
    ADD COLUMN `contractSent` BOOLEAN NOT NULL DEFAULT false;
