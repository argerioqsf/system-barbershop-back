/*
  Warnings:

  - You are about to drop the column `slugs` on the `organization` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `organization` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `courseId` to the `leads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `segmentId` to the `leads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `organization` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `organization_slugs_key` ON `organization`;

-- AlterTable
ALTER TABLE `leads` ADD COLUMN `courseId` VARCHAR(191) NOT NULL,
    ADD COLUMN `segmentId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `organization` DROP COLUMN `slugs`,
    ADD COLUMN `slug` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `organization_slug_key` ON `organization`(`slug`);

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_segmentId_fkey` FOREIGN KEY (`segmentId`) REFERENCES `segments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
