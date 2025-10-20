/*
  Warnings:

  - The values [PAYMENT] on the enum `transactions_reason` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `transactions` MODIFY `reason` ENUM('OTHER', 'UNIT_MAINTENANCE', 'LOAN', 'CASH_OPENING', 'PAY_LOAN', 'PAY_COMMISSION', 'PAY_PLAN_DEBT', 'ADD_COMMISSION') NOT NULL DEFAULT 'OTHER';
