/*
  Warnings:

  - You are about to drop the column `dueDateDebt` on the `plan_profiles` table. All the data in the column will be lost.
  - Added the required column `dueDate` to the `debts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dueDayDebt` to the `plan_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `debts` ADD COLUMN `dueDate` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `plan_profiles` DROP COLUMN `dueDateDebt`,
    ADD COLUMN `dueDayDebt` INTEGER NOT NULL;
