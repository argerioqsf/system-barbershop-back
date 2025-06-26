/*
  Warnings:

  - You are about to drop the column `discount` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `appointments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `appointments` DROP COLUMN `discount`,
    DROP COLUMN `value`;
