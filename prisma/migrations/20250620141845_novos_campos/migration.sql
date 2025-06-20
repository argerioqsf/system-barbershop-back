/*
  Warnings:

  - You are about to drop the column `action` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `permissions` table. All the data in the column will be lost.
  - Added the required column `name` to the `permissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `permissions_action_key` ON `permissions`;

-- AlterTable
ALTER TABLE `permissions` DROP COLUMN `action`,
    DROP COLUMN `category`,
    ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `features` (
    `id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_FeatureToPermission` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_FeatureToPermission_AB_unique`(`A`, `B`),
    INDEX `_FeatureToPermission_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_FeatureToPermission` ADD CONSTRAINT `_FeatureToPermission_A_fkey` FOREIGN KEY (`A`) REFERENCES `features`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FeatureToPermission` ADD CONSTRAINT `_FeatureToPermission_B_fkey` FOREIGN KEY (`B`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
