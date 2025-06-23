-- AlterTable
ALTER TABLE `units` ADD COLUMN `slotDuration` INTEGER NOT NULL DEFAULT 60;

-- CreateTable
CREATE TABLE `day_hours` (
    `id` VARCHAR(191) NOT NULL,
    `weekDay` INTEGER NOT NULL,
    `startHour` VARCHAR(191) NOT NULL,
    `endHour` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unit_day_hours` (
    `id` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `dayHourId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `unit_day_hours_unitId_dayHourId_key`(`unitId`, `dayHourId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile_work_hours` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `dayHourId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `profile_work_hours_profileId_dayHourId_key`(`profileId`, `dayHourId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile_blocked_hours` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `dayHourId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `unit_day_hours` ADD CONSTRAINT `unit_day_hours_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `unit_day_hours` ADD CONSTRAINT `unit_day_hours_dayHourId_fkey` FOREIGN KEY (`dayHourId`) REFERENCES `day_hours`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `profile_work_hours` ADD CONSTRAINT `profile_work_hours_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `profile_work_hours` ADD CONSTRAINT `profile_work_hours_dayHourId_fkey` FOREIGN KEY (`dayHourId`) REFERENCES `day_hours`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `profile_blocked_hours` ADD CONSTRAINT `profile_blocked_hours_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `profile_blocked_hours` ADD CONSTRAINT `profile_blocked_hours_dayHourId_fkey` FOREIGN KEY (`dayHourId`) REFERENCES `day_hours`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
