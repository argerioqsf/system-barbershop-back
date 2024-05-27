-- AlterTable
ALTER TABLE `leads` ADD COLUMN `archived` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `extract_profile` (
    `id` VARCHAR(191) NOT NULL,
    `amount_receive` DOUBLE NOT NULL,
    `profileId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `extract_profile` ADD CONSTRAINT `extract_profile_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
