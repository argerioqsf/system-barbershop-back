/*
  Warnings:

  - You are about to drop the column `end_cicle` on the `Cycle` table. All the data in the column will be lost.
  - You are about to drop the column `start_cicle` on the `Cycle` table. All the data in the column will be lost.
  - Added the required column `end_cycle` to the `Cycle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_cycle` to the `Cycle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Cycle` DROP COLUMN `end_cicle`,
    DROP COLUMN `start_cicle`,
    ADD COLUMN `end_cycle` DATETIME(3) NOT NULL,
    ADD COLUMN `start_cycle` DATETIME(3) NOT NULL;
