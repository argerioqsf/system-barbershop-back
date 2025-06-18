-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `isLoan` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `transactions` DROP COLUMN `loanAmount`;
