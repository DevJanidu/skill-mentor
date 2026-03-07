-- V4: Add cover_image_url to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500);
