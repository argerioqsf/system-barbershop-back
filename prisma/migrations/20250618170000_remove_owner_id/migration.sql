-- AlterTable
ALTER TABLE `organizations` DROP FOREIGN KEY `organizations_ownerId_fkey`;
ALTER TABLE `organizations` DROP COLUMN `ownerId`;
