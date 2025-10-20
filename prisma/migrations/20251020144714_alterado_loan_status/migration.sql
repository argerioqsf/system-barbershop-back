/*
  Warnings:

  - You are about to drop the column `fullyPaid` on the `loans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `loans` DROP COLUMN `fullyPaid`,
    MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELED', 'PAID', 'VALUE_TRANSFERRED', 'PAID_OFF') NOT NULL DEFAULT 'PENDING';
