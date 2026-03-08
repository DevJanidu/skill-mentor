CREATE TABLE IF NOT EXISTS mentor_availability (
    id              BIGSERIAL       PRIMARY KEY,
    mentor_id       BIGINT          NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
    day_of_week     VARCHAR(10)     NOT NULL,
    start_time      TIME            NOT NULL,
    end_time        TIME            NOT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    UNIQUE (mentor_id, day_of_week, start_time, end_time)
);

CREATE INDEX IF NOT EXISTS idx_mentor_availability_mentor ON mentor_availability(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_availability_day    ON mentor_availability(mentor_id, day_of_week);
