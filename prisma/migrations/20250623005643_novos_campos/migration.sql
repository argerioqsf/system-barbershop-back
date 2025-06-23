/*
  Warnings:

  - You are about to alter the column `commissionType` on the `barber_products` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(4))`.
  - You are about to alter the column `commissionType` on the `barber_services` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `Enum(EnumId(4))`.

*/
-- AlterTable
ALTER TABLE `barber_products` MODIFY `commissionType` ENUM('PERCENTAGE_OF_ITEM', 'PERCENTAGE_OF_USER', 'PERCENTAGE_OF_USER_ITEM') NOT NULL DEFAULT 'PERCENTAGE_OF_ITEM';

-- AlterTable
ALTER TABLE `barber_services` MODIFY `commissionType` ENUM('PERCENTAGE_OF_ITEM', 'PERCENTAGE_OF_USER', 'PERCENTAGE_OF_USER_ITEM') NOT NULL DEFAULT 'PERCENTAGE_OF_ITEM';

-- AlterTable
ALTER TABLE `permissions` MODIFY `name` ENUM('LIST_USER_ALL', 'LIST_USER_UNIT', 'LIST_USER_ORG', 'UPDATE_USER_ADMIN', 'UPDATE_USER_OWNER', 'UPDATE_USER_BARBER', 'MANAGE_OTHER_USER_TRANSACTION', 'LIST_PERMISSIONS_ALL', 'LIST_ROLES_UNIT', 'LIST_SALES_UNIT', 'LIST_APPOINTMENTS_UNIT', 'LIST_SERVICES_UNIT', 'SELL_PRODUCT', 'SELL_SERVICE', 'MANAGE_USER_TRANSACTION_ADD', 'MANAGE_USER_TRANSACTION_WITHDRAWAL', 'LIST_UNIT_ALL', 'LIST_UNIT_ORG', 'LIST_ROLES_ALL') NOT NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `commissionPercentage` DOUBLE NULL;

-- AlterTable
ALTER TABLE `profiles` MODIFY `commissionPercentage` DOUBLE NOT NULL DEFAULT 0;
