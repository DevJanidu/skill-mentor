-- V2: Add post-session resource link fields to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recording_link VARCHAR(500);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS resource_link VARCHAR(500);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS assessment_link VARCHAR(500);
