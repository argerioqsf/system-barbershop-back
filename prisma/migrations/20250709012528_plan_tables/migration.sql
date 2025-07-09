-- AlterTable
ALTER TABLE `sale_items` ADD COLUMN `planId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `type_recurrences` (
    `id` VARCHAR(191) NOT NULL,
    `period` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `benefits` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `discount` DOUBLE NULL,
    `discountType` ENUM('PERCENTAGE', 'VALUE') NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `benefit_plans` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `benefitId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `benefit_plans_planId_benefitId_key`(`planId`, `benefitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plans` (
    `id` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `typeRecurrenceId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category_services` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `category_services_categoryId_serviceId_key`(`categoryId`, `serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category_products` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `category_products_categoryId_productId_key`(`categoryId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `benefit_categories` (
    `id` VARCHAR(191) NOT NULL,
    `benefitId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `benefit_categories_benefitId_categoryId_key`(`benefitId`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `benefit_services` (
    `id` VARCHAR(191) NOT NULL,
    `benefitId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `benefit_services_benefitId_serviceId_key`(`benefitId`, `serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `benefit_products` (
    `id` VARCHAR(191) NOT NULL,
    `benefitId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `benefit_products_benefitId_productId_key`(`benefitId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `debts` (
    `id` VARCHAR(191) NOT NULL,
    `value` DOUBLE NOT NULL,
    `status` ENUM('PAID', 'PENDING') NOT NULL DEFAULT 'PAID',
    `planId` VARCHAR(191) NOT NULL,
    `planProfileId` VARCHAR(191) NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plan_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `planStartDate` DATETIME(3) NOT NULL,
    `status` ENUM('PAID', 'CANCELED', 'DEFAULTED') NOT NULL DEFAULT 'PAID',
    `saleItemId` VARCHAR(191) NOT NULL,
    `dueDateDebt` INTEGER NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `benefit_plans` ADD CONSTRAINT `benefit_plans_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `benefit_plans` ADD CONSTRAINT `benefit_plans_benefitId_fkey` FOREIGN KEY (`benefitId`) REFERENCES `benefits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plans` ADD CONSTRAINT `plans_typeRecurrenceId_fkey` FOREIGN KEY (`typeRecurrenceId`) REFERENCES `type_recurrences`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category_services` ADD CONSTRAINT `category_services_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category_services` ADD CONSTRAINT `category_services_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category_products` ADD CONSTRAINT `category_products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category_products` ADD CONSTRAINT `category_products_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `benefit_categories` ADD CONSTRAINT `benefit_categories_benefitId_fkey` FOREIGN KEY (`benefitId`) REFERENCES `benefits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `benefit_categories` ADD CONSTRAINT `benefit_categories_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `benefit_services` ADD CONSTRAINT `benefit_services_benefitId_fkey` FOREIGN KEY (`benefitId`) REFERENCES `benefits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `benefit_services` ADD CONSTRAINT `benefit_services_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `benefit_products` ADD CONSTRAINT `benefit_products_benefitId_fkey` FOREIGN KEY (`benefitId`) REFERENCES `benefits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `benefit_products` ADD CONSTRAINT `benefit_products_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `debts` ADD CONSTRAINT `debts_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `debts` ADD CONSTRAINT `debts_planProfileId_fkey` FOREIGN KEY (`planProfileId`) REFERENCES `plan_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plan_profiles` ADD CONSTRAINT `plan_profiles_saleItemId_fkey` FOREIGN KEY (`saleItemId`) REFERENCES `sale_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plan_profiles` ADD CONSTRAINT `plan_profiles_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plan_profiles` ADD CONSTRAINT `plan_profiles_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

