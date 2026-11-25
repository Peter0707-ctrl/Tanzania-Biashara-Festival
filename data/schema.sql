
-- ============================================================================
-- Tanzania Biashara Festival (TBF) - Production MySQL/MariaDB Schema
-- High-concurrency, ACID-compliant schema with row-level locking
-- Compatible with cPanel MySQL 8.0+ / MariaDB 10.4+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `reliancetech_tbf` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `reliancetech_tbf`;

-- 1. REGIONS & TOURS
CREATE TABLE IF NOT EXISTS `regions` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `venue` VARCHAR(255) NOT NULL,
  `dates` VARCHAR(120) NOT NULL,
  `dates_en` VARCHAR(120) DEFAULT NULL,
  `dates_zh` VARCHAR(120) DEFAULT NULL,
  `total_booths` INT UNSIGNED NOT NULL DEFAULT 40,
  `booked_booths` INT UNSIGNED NOT NULL DEFAULT 0,
  `registered_attendees` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('Active', 'Upcoming', 'Completed') NOT NULL DEFAULT 'Upcoming',
  `booked_codes` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_region_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BOOTH PACKAGES
CREATE TABLE IF NOT EXISTS `booth_packages` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `price_tzs` BIGINT UNSIGNED NOT NULL,
  `badge` VARCHAR(64) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `features` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BOOKINGS & EXHIBITORS (PII Encrypted at Application Layer with AES-256-GCM)
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` VARCHAR(32) NOT NULL,
  `control_number_enc` VARCHAR(255) NOT NULL,
  `business_name` VARCHAR(180) NOT NULL,
  `tagline` VARCHAR(255) DEFAULT NULL,
  `tagline_en` VARCHAR(255) DEFAULT NULL,
  `tagline_zh` VARCHAR(255) DEFAULT NULL,
  `contact_person_enc` VARCHAR(255) NOT NULL,
  `phone_enc` VARCHAR(255) NOT NULL,
  `phone_idx` VARCHAR(64) NOT NULL,
  `email_enc` VARCHAR(255) NOT NULL,
  `email_idx` VARCHAR(64) NOT NULL,
  `sector` VARCHAR(120) NOT NULL,
  `package_id` VARCHAR(64) NOT NULL,
  `package_name` VARCHAR(120) NOT NULL,
  `booth_code` VARCHAR(32) NOT NULL,
  `cities` JSON NOT NULL,
  `total_amount` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `payment_method` VARCHAR(64) NOT NULL DEFAULT 'NMB GePG / Control Number',
  `status` ENUM('Confirmed', 'Awaiting Payment', 'Cancelled', 'Expired') NOT NULL DEFAULT 'Awaiting Payment',
  `featured` TINYINT(1) NOT NULL DEFAULT 1,
  `access_pin_hash` VARCHAR(255) DEFAULT NULL,
  `client_request_id` VARCHAR(128) DEFAULT NULL,
  `payment_expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email_idx` (`email_idx`),
  INDEX `idx_phone_idx` (`phone_idx`),
  INDEX `idx_booth_status` (`booth_code`, `status`),
  UNIQUE INDEX `idx_client_request_id` (`client_request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BOOTH TEMPORARY HOLDS (High-concurrency anti-collision hold mechanism)
CREATE TABLE IF NOT EXISTS `booth_holds` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `hold_token` VARCHAR(64) NOT NULL,
  `booth_code` VARCHAR(32) NOT NULL,
  `cities` JSON NOT NULL,
  `device_id` VARCHAR(64) NOT NULL,
  `expires_at` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_hold_token` (`hold_token`),
  INDEX `idx_hold_booth` (`booth_code`),
  INDEX `idx_hold_expiry` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SPONSORS & PARTNERS
CREATE TABLE IF NOT EXISTS `sponsors` (
  `id` VARCHAR(64) NOT NULL,
  `company_name` VARCHAR(180) NOT NULL,
  `tier` VARCHAR(64) NOT NULL,
  `sector` VARCHAR(120) DEFAULT NULL,
  `contact_name_enc` VARCHAR(255) DEFAULT NULL,
  `phone_enc` VARCHAR(255) DEFAULT NULL,
  `email_enc` VARCHAR(255) DEFAULT NULL,
  `confirmed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ANNOUNCEMENTS & NEWS
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) DEFAULT NULL,
  `title_zh` VARCHAR(255) DEFAULT NULL,
  `content` TEXT NOT NULL,
  `content_en` TEXT DEFAULT NULL,
  `content_zh` TEXT DEFAULT NULL,
  `date` VARCHAR(32) NOT NULL,
  `badge` VARCHAR(64) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email_enc` VARCHAR(255) NOT NULL,
  `email_idx` VARCHAR(64) NOT NULL,
  `name_enc` VARCHAR(255) DEFAULT NULL,
  `ip_hash` VARCHAR(64) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX `idx_subscriber_email` (`email_idx`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. SECURITY AUDIT LOGS
CREATE TABLE IF NOT EXISTS `security_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `event_type` VARCHAR(64) NOT NULL,
  `identifier` VARCHAR(120) DEFAULT NULL,
  `device_id` VARCHAR(64) DEFAULT NULL,
  `ip_address` VARCHAR(64) DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_log_event` (`event_type`),
  INDEX `idx_log_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
