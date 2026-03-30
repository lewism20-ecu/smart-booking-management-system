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
      .send({ note: "test booking" });

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
