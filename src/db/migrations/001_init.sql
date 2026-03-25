-- Migration 001: Initial Schema
-- Run with: npm run migrate

-- Users (no foreign key dependencies — create first)
CREATE TABLE IF NOT EXISTS users (
    user_id    SERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(50)  NOT NULL DEFAULT 'user'
               CHECK (role IN ('user', 'admin', 'manager')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Venues (no foreign key dependencies — create second)
CREATE TABLE IF NOT EXISTS venues (
    venue_id          SERIAL PRIMARY KEY,
    name              VARCHAR(255) NOT NULL,
    approval_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Venue Managers (depends on users + venues)
CREATE TABLE IF NOT EXISTS venue_managers (
    user_id  INT NOT NULL REFERENCES users(user_id)   ON DELETE CASCADE,
    venue_id INT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, venue_id)
);

-- Resources (depends on venues)
CREATE TABLE IF NOT EXISTS resources (
    resource_id        SERIAL PRIMARY KEY,
    venue_id           INT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
    name               VARCHAR(255) NOT NULL,
    capacity           INT NOT NULL CHECK (capacity > 0),
    resource_type      VARCHAR(50) NOT NULL
                       CHECK (resource_type IN ('seat','room','desk','hybrid')),
    tags               TEXT[] DEFAULT '{}',
    availability_start TIME,
    availability_end   TIME,
    approval_required  BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (venue_id, name)
);

-- Bookings (depends on users + resources)
CREATE TABLE IF NOT EXISTS bookings (
    booking_id  SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(user_id)         ON DELETE CASCADE,
    resource_id INT NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
    start_time  TIMESTAMPTZ NOT NULL,
    end_time    TIMESTAMPTZ NOT NULL,
    status      VARCHAR(50) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected','cancelled')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_bookings_resource_time
    ON bookings (resource_id, start_time, end_time);

-- Reviews (depends on users + resources)
CREATE TABLE IF NOT EXISTS reviews (
    review_id   SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(user_id)         ON DELETE CASCADE,
    resource_id INT NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
    rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments    TEXT DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, resource_id)
);