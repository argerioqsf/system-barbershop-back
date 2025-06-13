-- AlterTable
ALTER TABLE `organizations` ADD COLUMN `slug` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `organizations_slug_key` ON `organizations`(`slug`);
