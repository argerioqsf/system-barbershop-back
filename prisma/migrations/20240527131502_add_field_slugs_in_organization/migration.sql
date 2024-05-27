/*
  Warnings:

  - You are about to drop the `profile_organization` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slugs]` on the table `organization` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slugs` to the `organization` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `profile_organization` DROP FOREIGN KEY `profile_organization_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `profile_organization` DROP FOREIGN KEY `profile_organization_userId_fkey`;

-- AlterTable
ALTER TABLE `organization` ADD COLUMN `slugs` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `profile_organization`;

-- CreateTable
CREATE TABLE `user_organization` (
    `userId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`userId`, `organizationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `organization_slugs_key` ON `organization`(`slugs`);

-- AddForeignKey
ALTER TABLE `user_organization` ADD CONSTRAINT `user_organization_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_organization` ADD CONSTRAINT `user_organization_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
