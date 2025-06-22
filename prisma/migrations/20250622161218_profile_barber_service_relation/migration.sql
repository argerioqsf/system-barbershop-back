-- AlterTable
ALTER TABLE `services` ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `commissionPercentage` DOUBLE NULL,
    ADD COLUMN `defaultTime` INTEGER NULL;

-- CreateTable
CREATE TABLE `barber_services` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `time` INTEGER NULL,
    `commissionPercentage` DOUBLE NULL,
    `commissionType` ENUM('PERCENTAGE_OF_SERVICE', 'PERCENTAGE_OF_USER', 'PERCENTAGE_OF_USER_SERVICE') NOT NULL DEFAULT 'PERCENTAGE_OF_SERVICE',

    UNIQUE INDEX `barber_services_profileId_serviceId_key`(`profileId`, `serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `barber_services` ADD CONSTRAINT `barber_services_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barber_services` ADD CONSTRAINT `barber_services_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

