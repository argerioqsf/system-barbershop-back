-- CreateTable
CREATE TABLE `checkpoint_commission_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `totalBalance` DOUBLE NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `cashRegisterSessionId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `checkpoint_commission_profiles` ADD CONSTRAINT `checkpoint_commission_profiles_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checkpoint_commission_profiles` ADD CONSTRAINT `checkpoint_commission_profiles_cashRegisterSessionId_fkey` FOREIGN KEY (`cashRegisterSessionId`) REFERENCES `cash_register_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
