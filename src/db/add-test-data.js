require("dotenv").config({ path: process.env.ENV_FILE || ".env.local" });
const bcrypt = require("bcrypt");
const { pool } = require("./index");

const SALT_ROUNDS = 10;

async function addTestData(db) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      "TRUNCATE reviews, bookings, resources, venue_managers, venues, users RESTART IDENTITY CASCADE",
    );

    // Users
    const [adminHash, managerHash, user1Hash, user2Hash] = await Promise.all([
      bcrypt.hash("Admin123!", SALT_ROUNDS),
      bcrypt.hash("Manager123!", SALT_ROUNDS),
      bcrypt.hash("User123!", SALT_ROUNDS),
      bcrypt.hash("User123!", SALT_ROUNDS),
    ]);

    const { rows: users } = await client.query(
      `
      INSERT INTO users (email, password, role) VALUES
        ('admin@example.com',   $1, 'admin'),
        ('manager@example.com', $2, 'manager'),
        ('alice@example.com',   $3, 'user'),
        ('bob@example.com',     $4, 'user')
      RETURNING user_id, email, role
    `,
      [adminHash, managerHash, user1Hash, user2Hash],
    );

    console.log(
      "Inserted users:",
      users.map((u) => `${u.email} (${u.role})`).join(", "),
    );

    const adminId = users[0].user_id;
    const managerId = users[1].user_id;
    const aliceId = users[2].user_id;
    const bobId = users[3].user_id;

    // Venues
    const { rows: venues } = await client.query(`
      INSERT INTO venues (name, approval_required) VALUES
        ('City Hub',      FALSE),
        ('Tech Campus',   TRUE),
        ('Creative Space', FALSE)
      RETURNING venue_id, name
    `);

    console.log("Inserted venues:", venues.map((v) => v.name).join(", "));

    const [cityHubId, techCampusId, creativeSpaceId] = venues.map(
      (v) => v.venue_id,
    );

    // Venue Managers
    await client.query(
      `
      INSERT INTO venue_managers (user_id, venue_id) VALUES
        ($1, $2),
        ($1, $3)
    `,
      [managerId, cityHubId, techCampusId],
    );

    console.log(`Assigned manager@example.com to City Hub and Tech Campus`);

    // Resources
    const { rows: resources } = await client.query(
      `
      INSERT INTO resources (venue_id, name, capacity, resource_type, tags, availability_start, availability_end, approval_required) VALUES
        ($1, 'Desk A1',          1,  'desk',   '{quiet,window}',         '08:00', '18:00', FALSE),
        ($1, 'Desk A2',          1,  'desk',   '{quiet}',                '08:00', '18:00', FALSE),
        ($1, 'Meeting Room 1',   8,  'room',   '{projector,whiteboard}', '08:00', '20:00', FALSE),
        ($2, 'Conference Room',  20, 'room',   '{av,video-call}',        '09:00', '17:00', TRUE),
        ($2, 'Hot Desk 1',       1,  'desk',   '{standing}',             '07:00', '22:00', FALSE),
        ($3, 'Studio A',         6,  'hybrid', '{podcast,recording}',    '10:00', '22:00', FALSE),
        ($3, 'Workshop Table 1', 12, 'room',   '{crafts,large-table}',   '09:00', '21:00', FALSE)
      RETURNING resource_id, name
    `,
      [cityHubId, techCampusId, creativeSpaceId],
    );

    console.log("Inserted resources:", resources.map((r) => r.name).join(", "));

    const deskA1Id = resources[0].resource_id;
    const meetingRoom1Id = resources[2].resource_id;
    const conferenceRoomId = resources[3].resource_id;
    const studioAId = resources[5].resource_id;

    // Bookings
    const { rows: bookings } = await client.query(
      `
      INSERT INTO bookings (user_id, resource_id, start_time, end_time, status) VALUES
        ($1, $3, NOW() + INTERVAL '1 day',             NOW() + INTERVAL '1 day 1 hour',    'approved'),
        ($2, $4, NOW() + INTERVAL '2 days',            NOW() + INTERVAL '2 days 2 hours',  'pending'),
        ($1, $5, NOW() + INTERVAL '3 days',            NOW() + INTERVAL '3 days 3 hours',  'approved'),
        ($2, $6, NOW() - INTERVAL '2 days',            NOW() - INTERVAL '2 days' + INTERVAL '90 minutes', 'approved'),
        ($1, $3, NOW() - INTERVAL '7 days',            NOW() - INTERVAL '7 days' + INTERVAL '1 hour', 'approved'),
        ($2, $7, NOW() + INTERVAL '5 days 9 hours',    NOW() + INTERVAL '5 days 11 hours', 'pending')
      RETURNING booking_id, status
    `,
      [
        aliceId,
        bobId,
        deskA1Id,
        meetingRoom1Id,
        conferenceRoomId,
        studioAId,
        resources[1].resource_id,
      ],
    );

    console.log(`Inserted ${bookings.length} bookings`);

    // Reviews
    const { rows: reviews } = await client.query(
      `
      INSERT INTO reviews (user_id, resource_id, rating, comments) VALUES
        ($1, $3, 5, 'Great desk, very quiet and good natural light.'),
        ($2, $4, 4, 'Well-equipped room, though booking approval took a while.'),
        ($1, $5, 3, 'Decent space but the AV setup had some issues on the day.')
      RETURNING review_id
    `,
      [aliceId, bobId, deskA1Id, meetingRoom1Id, conferenceRoomId],
    );

    console.log(`Inserted ${reviews.length} reviews`);

    await client.query("COMMIT");
    console.log("\nSeed complete.");

    console.log("\nTest credentials:");
    console.log("  admin@example.com   / Admin123!");
    console.log("  manager@example.com / Manager123!");
    console.log("  alice@example.com   / User123!");
    console.log("  bob@example.com     / User123!");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { addTestData };

if (require.main === module) {
  addTestData(pool)
    .then(() => pool.end())
    .catch((err) => {
      console.error("Seed failed:", err.message);
      process.exit(1);
    });
}
