/*
  Warnings:

  - Added the required column `amount_pay_consultant` to the `leads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount_pay_indicator` to the `leads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amountToReceive` to the `profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `leads` ADD COLUMN `amount_pay_consultant` DOUBLE NOT NULL,
    ADD COLUMN `amount_pay_indicator` DOUBLE NOT NULL,
    ADD COLUMN `cicleId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `amountToReceive` DOUBLE NOT NULL;

-- CreateTable
CREATE TABLE `Cycle` (
    `id` VARCHAR(191) NOT NULL,
    `start_cicle` DATETIME(3) NOT NULL,
    `end_cicle` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_cicleId_fkey` FOREIGN KEY (`cicleId`) REFERENCES `Cycle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
