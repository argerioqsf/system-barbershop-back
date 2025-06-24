-- Drop existing DayHour table
DROP TABLE IF EXISTS `day_hours`;

-- Rename unit_day_hours to unit_opening_hours and add new columns
ALTER TABLE `unit_day_hours` RENAME TO `unit_opening_hours`;
ALTER TABLE `unit_opening_hours`
  ADD COLUMN `weekDay` INT NOT NULL,
  ADD COLUMN `startHour` VARCHAR(191) NOT NULL,
  ADD COLUMN `endHour` VARCHAR(191) NOT NULL,
  DROP COLUMN `dayHourId`;

-- Modify profile_work_hours table
ALTER TABLE `profile_work_hours`
  ADD COLUMN `weekDay` INT NOT NULL,
  ADD COLUMN `startHour` VARCHAR(191) NOT NULL,
  ADD COLUMN `endHour` VARCHAR(191) NOT NULL,
  DROP COLUMN `dayHourId`;
