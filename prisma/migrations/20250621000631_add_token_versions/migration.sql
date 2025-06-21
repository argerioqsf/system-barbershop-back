-- AlterTable
ALTER TABLE `users` ADD COLUMN `versionToken` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `versionTokenInvalidate` INTEGER NULL;

