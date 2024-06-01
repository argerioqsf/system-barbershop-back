/*
  Warnings:

  - Made the column `start_cycle` on table `Cycle` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Cycle` MODIFY `start_cycle` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `leads` MODIFY `amount_pay_consultant` DOUBLE NULL,
    MODIFY `amount_pay_indicator` DOUBLE NULL;

-- AlterTable
ALTER TABLE `profiles` MODIFY `amountToReceive` DOUBLE NULL;
