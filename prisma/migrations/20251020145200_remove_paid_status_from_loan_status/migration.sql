/*
  Warnings:

  - The values [PAID] on the enum `loans_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `loans` MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELED', 'VALUE_TRANSFERRED', 'PAID_OFF') NOT NULL DEFAULT 'PENDING';
