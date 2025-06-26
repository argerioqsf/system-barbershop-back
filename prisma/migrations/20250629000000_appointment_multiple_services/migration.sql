-- AlterTable
ALTER TABLE `appointments` DROP COLUMN `serviceId`;

-- CreateTable
CREATE TABLE `appointment_services` (
    `id` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `appointment_services_appointmentId_serviceId_key` ON `appointment_services`(`appointmentId`, `serviceId`);

-- AddForeignKey
ALTER TABLE `appointment_services` ADD CONSTRAINT `appointment_services_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `appointment_services` ADD CONSTRAINT `appointment_services_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
