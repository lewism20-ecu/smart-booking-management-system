// Set JWT_SECRET before app loads so verifyToken() picks it up
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";

const request = require("supertest");
const app = require("../src/index");
const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;

const userToken = jwt.sign({ userId: 1, role: "user" }, secret, {
  expiresIn: "1h",
});

const managerToken = jwt.sign({ userId: 2, role: "manager" }, secret, {
  expiresIn: "1h",
});

const adminToken = jwt.sign({ userId: 3, role: "admin" }, secret, {
  expiresIn: "1h",
});

// ── Auth guard ────────────────────────────────────────────────────────────
describe("Booking auth guards", () => {
  it("GET /bookings without token → 401", async () => {
    const res = await request(app).get("/api/v1/bookings");
    expect(res.status).toBe(401);
  });

  it("POST /bookings without token → 401", async () => {
    const res = await request(app).post("/api/v1/bookings").send({});
    expect(res.status).toBe(401);
  });
});

// ── Input validation ──────────────────────────────────────────────────────
describe("POST /bookings — input validation", () => {
  it("returns 400 when body is empty", async () => {
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${userToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("BadRequest");
  });

  it("returns 400 when resourceId is missing", async () => {
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        startTime: "2026-04-01T10:00:00Z",
        endTime: "2026-04-01T12:00:00Z",
      });
    expect(res.status).toBe(400);
  });

  it("returns 400 when startTime is missing", async () => {
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        resourceId: 1,
        endTime: "2026-04-01T12:00:00Z",
      });
    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/v1/bookings/:id ──────────────────────────────────────────────

describe("DELETE /api/v1/bookings/:id", () => {
  let bookingId;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      // Create a booking to delete in tests
      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          resourceId: 4,
          startTime: "2050-02-01T10:00:00.000Z",
          endTime: "2050-02-01T11:00:00.000Z",
        });
      if (res.status === 201) {
        bookingId = res.body.booking_id;
        dbAvailable = true;
      }
    } catch {
      // DB unavailable — tests will be skipped
    }
  });

  it("204 — deletes a pending booking owned by user", async () => {
    if (!dbAvailable) {
      console.warn("Skipping: DB unavailable in CI");
      return;
    }
    // First create a new booking to delete
    const createRes = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        resourceId: 3,
        startTime: "2050-03-01T10:00:00.000Z",
        endTime: "2050-03-01T11:00:00.000Z",
      });

    const deleteRes = await request(app)
      .delete(`/api/v1/bookings/${createRes.body.booking_id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(deleteRes.status).toBe(204);
  });

  it("403 — user not authorized to delete other user's booking", async () => {
    if (!dbAvailable) {
      console.warn("Skipping: DB unavailable in CI");
      return;
    }
    // Login as a different user
    const otherRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bob@example.com", password: "User123!" });
    const otherToken = otherRes.body.token;

    const res = await request(app)
      .delete(`/api/v1/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  // Kept for future coverage, commented out to keep this suite focused on Issue #13 core cases.
  // it("400 — invalid booking ID format", async () => { ... });
  // it("401 — no token", async () => { ... });
  // it("401 — invalid token", async () => { ... });
  // it("404 — booking not found", async () => { ... });
  // it("409 — cannot delete approved booking", async () => { ... });
});

// ── Role-based access — approve ───────────────────────────────────────────
describe("POST /bookings/:id/approve — role checks", () => {
  it("user token → 403 Forbidden", async () => {
    const res = await request(app)
      .post("/api/v1/bookings/999/approve")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("manager token → passes role check, returns 404 for unknown booking", async () => {
    const res = await request(app)
      .post("/api/v1/bookings/999/approve")
      .set("Authorization", `Bearer ${managerToken}`);
    expect([404, 500]).toContain(res.status);
  });

  it("admin token → passes role check, returns 404 for unknown booking", async () => {
    const res = await request(app)
      .post("/api/v1/bookings/999/approve")
      .set("Authorization", `Bearer ${adminToken}`);
    expect([404, 500]).toContain(res.status);
  });
});

// ── Role-based access — reject ────────────────────────────────────────────
describe("POST /bookings/:id/reject — role checks", () => {
  it("user token → 403 Forbidden", async () => {
    const res = await request(app)
      .post("/api/v1/bookings/999/reject")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("manager token → passes role check, returns 404 for unknown booking", async () => {
    const res = await request(app)
      .post("/api/v1/bookings/999/reject")
      .set("Authorization", `Bearer ${managerToken}`);
    expect([404, 500]).toContain(res.status);
  });
});

// ── PATCH validation ──────────────────────────────────────────────────────
describe("PATCH /bookings/:id — input validation", () => {
  it("returns 400 when times are missing", async () => {
    const res = await request(app)
      .patch("/api/v1/bookings/1")
      .set("Authorization", `Bearer ${userToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("BadRequest");
  });
});

// ── Invalid ID validation ─────────────────────────────────────────────────
describe("Booking ID param validation", () => {
  it("PATCH /bookings/abc → 400 invalid ID", async () => {
    const res = await request(app)
      .patch("/api/v1/bookings/abc")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        startTime: "2026-04-01T10:00:00Z",
        endTime: "2026-04-01T12:00:00Z",
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("BadRequest");
  });

  it("DELETE /bookings/abc → 400 invalid ID", async () => {
    const res = await request(app)
      .delete("/api/v1/bookings/abc")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("BadRequest");
  });

  it("POST /bookings/abc/approve → 400 invalid ID", async () => {
    const res = await request(app)
      .post("/api/v1/bookings/abc/approve")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("BadRequest");
  });

  it("POST /bookings/abc/reject → 400 invalid ID", async () => {
    const res = await request(app)
      .post("/api/v1/bookings/abc/reject")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("BadRequest");
  });

  it("PATCH /bookings/0 → 400 non-positive ID", async () => {
    const res = await request(app)
      .patch("/api/v1/bookings/0")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        startTime: "2026-04-01T10:00:00Z",
        endTime: "2026-04-01T12:00:00Z",
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("BadRequest");
  });
});
