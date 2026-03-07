-- V1: Add missing columns for receipt flow, subject enrichment, mentor ratings
-- Run manually if Flyway is not configured: psql -f V1__add_missing_columns.sql

-- Sessions: receipt tracking
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS receipt_status VARCHAR(30) DEFAULT 'NONE';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS meeting_password VARCHAR(100);

-- Subjects: enrichment
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500);
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Mentors: cached rating
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS total_reviews INT DEFAULT 0;
