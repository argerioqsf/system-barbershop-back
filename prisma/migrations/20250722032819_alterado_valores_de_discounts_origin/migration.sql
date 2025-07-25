/*
  Warnings:

  - The values [COUPON,VALUE] on the enum `discounts_origin` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `discounts` MODIFY `origin` ENUM('COUPON_SALE_ITEM', 'COUPON_SALE', 'PLAN', 'VALUE_SALE_ITEM') NOT NULL;
