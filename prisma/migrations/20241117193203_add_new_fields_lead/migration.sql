-- AlterTable
ALTER TABLE `leads` ADD COLUMN `birthday` VARCHAR(191) NULL,
    ADD COLUMN `class` VARCHAR(191) NULL,
    ADD COLUMN `noteLead` INTEGER NULL,
    ADD COLUMN `personalityTraits` ENUM('colerico', 'melancolico', 'fleumatico', 'sanguineo') NULL,
    MODIFY `document` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NULL;
