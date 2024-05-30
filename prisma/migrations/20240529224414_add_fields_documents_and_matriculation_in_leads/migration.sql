-- AlterTable
ALTER TABLE `leads` ADD COLUMN `documents` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `matriculation` BOOLEAN NOT NULL DEFAULT false;
