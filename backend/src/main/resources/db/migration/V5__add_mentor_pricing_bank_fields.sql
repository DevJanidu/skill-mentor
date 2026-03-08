-- V5: Add pricing and bank details to mentors table
-- Columns are nullable to preserve existing mentors; enforce via DTO validation on create/update
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(100);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(30);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
