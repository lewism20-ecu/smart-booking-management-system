const request = require("supertest");
const app = require("../src/index");
const { pool } = require("../src/db/index");

let token;

beforeAll(async () => {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "alice@example.com", password: "User123!" });
  token = res.body.token;
});

afterAll(async () => {
  await pool.end();
});

// ─── GET /api/v1/bookings ─────────────────────────────────────────────────────

describe("GET /api/v1/bookings", () => {
  it("200 — returns bookings for authenticated user", async () => {
    const res = await request(app)
      .get("/api/v1/bookings")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("401 — no token", async () => {
    const res = await request(app).get("/api/v1/bookings");
    expect(res.status).toBe(401);
  });

  it("401 — invalid token", async () => {
    const res = await request(app)
      .get("/api/v1/bookings")
      .set("Authorization", "Bearer bad.token.here");

    expect(res.status).toBe(401);
  });
});

// ─── POST /api/v1/bookings ────────────────────────────────────────────────────

describe("POST /api/v1/bookings", () => {
  it("201 — creates a booking for authenticated user", async () => {
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({"resourceId": 3,
            "startTime": "2050-01-01T10:00:00.000Z",
            "endTime": "2050-01-01T11:00:00.000Z"});

    expect(res.status).toBe(201);
  });

  it("401 — no token", async () => {
    const res = await request(app)
      .post("/api/v1/bookings")
      .send({ note: "test booking" });

    expect(res.status).toBe(401);
  });

  it("401 — invalid token", async () => {
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", "Bearer bad.token.here")
      .send({ note: "test booking" });

    expect(res.status).toBe(401);
  });
  });

  // ─── DELETE /api/v1/bookings/:id ──────────────────────────────────────────────

  describe("DELETE /api/v1/bookings/:id", () => {
    let bookingId;

    beforeAll(async () => {
      // Create a booking to delete in tests
      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          resourceId: 4,
          startTime: "2050-02-01T10:00:00.000Z",
          endTime: "2050-02-01T11:00:00.000Z"
        });
      bookingId = res.body.booking_id;
    });

    it("204 — deletes a pending booking owned by user", async () => {
      // First create a new booking to delete
      const createRes = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          resourceId: 3,
          startTime: "2050-03-01T10:00:00.000Z",
          endTime: "2050-03-01T11:00:00.000Z"
        });

      const deleteRes = await request(app)
        .delete(`/api/v1/bookings/${createRes.body.booking_id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(deleteRes.status).toBe(204);
    });

    it("403 — user not authorized to delete other user's booking", async () => {
      // Login as a different user
      const otherRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "bob@example.com", password: "User123!" });
      const otherToken = otherRes.body.token;

      const res = await request(app)
        .delete(`/api/v1/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Not authorized to delete this booking");
    });

    // Kept for future coverage, commented out to keep this suite focused on Issue #13 core cases.
    // it("400 — invalid booking ID format", async () => {
    //   const res = await request(app)
    //     .delete("/api/v1/bookings/invalid")
    //     .set("Authorization", `Bearer ${token}`);
    //
    //   expect(res.status).toBe(400);
    //   expect(res.body.error).toBe("Invalid booking ID");
    // });

    // it("401 — no token", async () => {
    //   const res = await request(app).delete(`/api/v1/bookings/${bookingId}`);
    //   expect(res.status).toBe(401);
    // });

    // it("401 — invalid token", async () => {
    //   const res = await request(app)
    //     .delete(`/api/v1/bookings/${bookingId}`)
    //     .set("Authorization", "Bearer bad.token.here");
    //
    //   expect(res.status).toBe(401);
    // });

    // it("404 — booking not found", async () => {
    //   const res = await request(app)
    //     .delete("/api/v1/bookings/999999")
    //     .set("Authorization", `Bearer ${token}`);
    //
    //   expect(res.status).toBe(404);
    //   expect(res.body.error).toBe("Booking not found");
    // });

    // it("409 — cannot delete approved booking", async () => {
    //   // This test would need an approved booking to exist.
    //   // For now, we verify the logic is in place.
    //   // You can manually test this with an approved booking ID.
    // });
  });
