-- ============================================================
-- Seed: 001_test_data.sql
-- Test data for development and testing
-- Run with: npm run seed
-- WARNING: Do not run against production database
-- ============================================================

-- Only insert if users don't already exist
INSERT INTO users (email, password, role)
VALUES
  -- password: User123!
  ('alice@example.com',
   '$2b$10$WAvmtMurHFQcFyw8AkX2WOhKZq.dfDwcZ87DcNWh6SwgL3.gJ7iUu',
   'user'),

  -- password: Manager123!
  ('bob@example.com',
   '$2b$10$WAvmtMurHFQcFyw8AkX2WOhKZq.dfDwcZ87DcNWh6SwgL3.gJ7iUu',
   'manager'),

  -- password: Admin123!
  ('admin@example.com',
   '$2b$10$WAvmtMurHFQcFyw8AkX2WOhKZq.dfDwcZ87DcNWh6SwgL3.gJ7iUu',
   'admin')

ON CONFLICT (email) DO NOTHING;

-- Test venue
INSERT INTO venues (name, approval_required)
VALUES ('Test Venue', true)
ON CONFLICT DO NOTHING;

-- Assign bob as manager of venue 1
INSERT INTO venue_managers (user_id, venue_id)
SELECT u.user_id, v.venue_id
FROM users u, venues v
WHERE u.email = 'bob@example.com'
  AND v.name  = 'Test Venue'
ON CONFLICT DO NOTHING;

-- Test resource in venue 1
INSERT INTO resources (venue_id, name, capacity, resource_type, tags)
SELECT v.venue_id, 'Room 101', 10, 'room', ARRAY['wifi', 'projector']
FROM venues v
WHERE v.name = 'Test Venue'
ON CONFLICT DO NOTHING;
