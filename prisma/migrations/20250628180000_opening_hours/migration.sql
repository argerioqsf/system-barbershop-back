-- Adjust unit_day_hours structure
ALTER TABLE `unit_day_hours` DROP FOREIGN KEY `unit_day_hours_dayHourId_fkey`;
DROP INDEX `unit_day_hours_unitId_dayHourId_key` ON `unit_day_hours`;
ALTER TABLE `unit_day_hours`
  DROP COLUMN `dayHourId`,
  ADD COLUMN `weekDay` INT NOT NULL,
  ADD COLUMN `startHour` VARCHAR(191) NOT NULL,
  ADD COLUMN `endHour` VARCHAR(191) NOT NULL;
RENAME TABLE `unit_day_hours` TO `unit_opening_hours`;

-- Adjust profile_work_hours structure
ALTER TABLE `profile_work_hours` DROP FOREIGN KEY `profile_work_hours_dayHourId_fkey`;
DROP INDEX `profile_work_hours_profileId_dayHourId_key` ON `profile_work_hours`;
ALTER TABLE `profile_work_hours`
  DROP COLUMN `dayHourId`,
  ADD COLUMN `weekDay` INT NOT NULL,
  ADD COLUMN `startHour` VARCHAR(191) NOT NULL,
  ADD COLUMN `endHour` VARCHAR(191) NOT NULL;

-- Remove obsolete table
DROP TABLE `day_hours`;
