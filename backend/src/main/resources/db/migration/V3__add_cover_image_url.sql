-- V3: Add cover_image_url to mentors table
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500);
