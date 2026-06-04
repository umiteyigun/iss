-- BTK export: record clock authority metadata on each seal
USE radius;

ALTER TABLE `btk_log_exports`
  ADD COLUMN `signed_at_authority` VARCHAR(32) NOT NULL DEFAULT 'mysql' AFTER `signed_at`,
  ADD COLUMN `signed_at_timezone` VARCHAR(32) NOT NULL DEFAULT '+03:00' AFTER `signed_at_authority`,
  ADD COLUMN `clock_drift_ms` INT NOT NULL DEFAULT 0 AFTER `signed_at_timezone`,
  ADD COLUMN `reference_now` DATETIME(6) NULL AFTER `clock_drift_ms`;
