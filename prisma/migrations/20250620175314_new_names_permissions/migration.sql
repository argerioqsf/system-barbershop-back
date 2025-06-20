/*
  Warnings:

  - The values [LISTUSERALL] on the enum `permissions_name` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `permissions` MODIFY `name` ENUM('LIST_USER_ALL', 'LIST_USER_UNIT', 'LIST_USER_ORG', 'UPDATE_USER_ADMIN', 'UPDATE_USER_OWNER', 'UPDATE_USER_BARBER') NOT NULL;
