-- AlterTable
ALTER TABLE `units` ADD COLUMN `slug` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `units_slug_key` ON `units`(`slug`);
