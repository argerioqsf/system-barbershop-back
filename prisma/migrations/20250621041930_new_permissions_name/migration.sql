/*
  Warnings:

  - The values [ROLE] on the enum `roles_name` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `permissions` MODIFY `category` ENUM('UNIT', 'SERVICE', 'USER', 'PRODUCT', 'PROFILE', 'ROLE') NOT NULL;

-- AlterTable
ALTER TABLE `roles` MODIFY `name` ENUM('ADMIN', 'BARBER', 'CLIENT', 'ATTENDANT', 'MANAGER', 'OWNER') NOT NULL;
