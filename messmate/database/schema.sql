-- ============================================================================
-- MessMate — MySQL 8.0+ Database Schema (database/schema.sql)
-- Engine: InnoDB | Character Set: utf8mb4 | Timezone: UTC
-- ============================================================================

CREATE DATABASE IF NOT EXISTS messmate_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE messmate_db;

-- 1. USERS TABLE (Students & Administrators)
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    role ENUM('STUDENT', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT chk_users_role CHECK (role IN ('STUDENT', 'ADMIN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_role_active ON users (role, is_active);

-- 2. FOOD ITEMS TABLE (Mess Menu Items)
CREATE TABLE IF NOT EXISTS food_items (
    food_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500) NULL,
    meal_category ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS') NOT NULL,
    is_available TINYINT(1) NOT NULL DEFAULT 1,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by_admin_id BIGINT UNSIGNED NULL,
    updated_by_admin_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_food_name_category UNIQUE (name, meal_category),
    CONSTRAINT fk_food_created_by FOREIGN KEY (created_by_admin_id) REFERENCES users (user_id) ON DELETE SET NULL,
    CONSTRAINT fk_food_updated_by FOREIGN KEY (updated_by_admin_id) REFERENCES users (user_id) ON DELETE SET NULL,
    CONSTRAINT chk_food_meal_category CHECK (meal_category IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_food_category_active_avail ON food_items (meal_category, is_active, is_available);

-- 3. FEEDBACK TABLE (Student Food Ratings, Comments, Suggestions & Complaints)
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,
    food_id BIGINT UNSIGNED NOT NULL,
    meal_category ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS') NOT NULL,
    service_date DATE NOT NULL,
    taste_rating TINYINT UNSIGNED NOT NULL,
    quality_rating TINYINT UNSIGNED NOT NULL,
    quantity_rating TINYINT UNSIGNED NOT NULL,
    hygiene_rating TINYINT UNSIGNED NOT NULL,
    overall_rating TINYINT UNSIGNED NOT NULL,
    comments VARCHAR(1000) NULL,
    suggestions VARCHAR(1000) NULL,
    complaint_category ENUM('NONE', 'TASTE', 'QUALITY', 'QUANTITY', 'HYGIENE', 'TEMPERATURE', 'VARIETY', 'OTHER') NOT NULL DEFAULT 'NONE',
    complaint_status ENUM('NONE', 'OPEN', 'IN_PROGRESS', 'RESOLVED') NOT NULL DEFAULT 'NONE',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    deleted_by_admin_id BIGINT UNSIGNED NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    -- Duplicate submission policy: A student can submit at most one active feedback per food item + service date
    CONSTRAINT uq_student_food_service_date UNIQUE (student_id, food_id, service_date, is_deleted),
    CONSTRAINT fk_feedback_student FOREIGN KEY (student_id) REFERENCES users (user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_feedback_food FOREIGN KEY (food_id) REFERENCES food_items (food_id) ON DELETE RESTRICT,
    CONSTRAINT fk_feedback_deleted_by FOREIGN KEY (deleted_by_admin_id) REFERENCES users (user_id) ON DELETE SET NULL,
    CONSTRAINT chk_taste_rating CHECK (taste_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_quality_rating CHECK (quality_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_quantity_rating CHECK (quantity_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_hygiene_rating CHECK (hygiene_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_overall_rating CHECK (overall_rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_feedback_student_date ON feedback (student_id, is_deleted, submitted_at DESC);
CREATE INDEX idx_feedback_food_deleted ON feedback (food_id, is_deleted);
CREATE INDEX idx_feedback_service_date ON feedback (service_date, is_deleted);
CREATE INDEX idx_feedback_meal_category ON feedback (meal_category, is_deleted);
CREATE INDEX idx_feedback_complaint ON feedback (complaint_category, complaint_status, is_deleted);
CREATE INDEX idx_feedback_overall_rating ON feedback (overall_rating, is_deleted);

-- 4. IMPROVEMENT ACTIONS TABLE (Mess Team Actions & Status Audit History)
CREATE TABLE IF NOT EXISTS improvement_actions (
    action_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    feedback_id BIGINT UNSIGNED NOT NULL,
    admin_id BIGINT UNSIGNED NOT NULL,
    previous_status ENUM('NONE', 'OPEN', 'IN_PROGRESS', 'RESOLVED') NOT NULL,
    new_status ENUM('NONE', 'OPEN', 'IN_PROGRESS', 'RESOLVED') NOT NULL,
    action_text VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_improvement_feedback FOREIGN KEY (feedback_id) REFERENCES feedback (feedback_id) ON DELETE RESTRICT,
    CONSTRAINT fk_improvement_admin FOREIGN KEY (admin_id) REFERENCES users (user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_improvement_feedback ON improvement_actions (feedback_id, created_at DESC);
CREATE INDEX idx_improvement_admin ON improvement_actions (admin_id, created_at DESC);

-- 5. AUDIT LOGS TABLE (Administrative Changes, Menu Edits & Soft Deletions)
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT UNSIGNED NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id BIGINT UNSIGNED NOT NULL,
    summary VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_admin FOREIGN KEY (admin_id) REFERENCES users (user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_created_at ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id);
