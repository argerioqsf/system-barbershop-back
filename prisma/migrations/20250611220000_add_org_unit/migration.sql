-- Add organization and unit structures
CREATE TABLE `organizations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `units` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_units` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    UNIQUE INDEX `user_units_userId_unitId_key`(`userId`, `unitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `users` ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;
ALTER TABLE `appointments` ADD COLUMN `unitId` VARCHAR(191) NOT NULL;
ALTER TABLE `services` ADD COLUMN `unitId` VARCHAR(191) NOT NULL;
ALTER TABLE `transactions` ADD COLUMN `unitId` VARCHAR(191) NOT NULL;
ALTER TABLE `sales` ADD COLUMN `unitId` VARCHAR(191) NOT NULL;
ALTER TABLE `cash_register_sessions` ADD COLUMN `unitId` VARCHAR(191) NOT NULL;

ALTER TABLE `units` ADD CONSTRAINT `units_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `user_units` ADD CONSTRAINT `user_units_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_units` ADD CONSTRAINT `user_units_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `services` ADD CONSTRAINT `services_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `sales` ADD CONSTRAINT `sales_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cash_register_sessions` ADD CONSTRAINT `cash_register_sessions_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
