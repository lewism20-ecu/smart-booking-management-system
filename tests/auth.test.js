const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/index");
const { pool } = require("../src/db/index");

const TEST_EMAIL = "authtest@example.com";
const TEST_PASSWORD = "StrongPass123!";

// bcrypt + DB operations can be slow in CI
jest.setTimeout(15000);

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email = $1", [TEST_EMAIL]);
  await pool.end();
});

describe("POST /api/v1/auth/signup", () => {
  it("201 - creates a user and returns a token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.user.role).toBe("user");
  });

  it("409 - duplicate email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Conflict");
  });

  it("400 - missing email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ password: TEST_PASSWORD });

    expect(res.status).toBe(400);
  });

  it("400 - missing password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email: "another@example.com" });

    expect(res.status).toBe(400);
  });

  it("400 - weak password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email: "weak@example.com", password: "weak" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Weak password");
  });

  it("400 - empty body", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send({});
    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("200 - valid credentials return a token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it("401 - wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: "WrongPass999!" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("401 - email not found", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@example.com", password: TEST_PASSWORD });

    expect(res.status).toBe(401);
  });

  it("400 - missing email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ password: TEST_PASSWORD });

    expect(res.status).toBe(400);
  });

  it("400 - missing password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL });

    expect(res.status).toBe(400);
  });

  it("400 - empty body", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({});
    expect(res.status).toBe(400);
  });
});

describe("Auth middleware", () => {
  it("GET /users/me returns 401 with no token", async () => {
    const res = await request(app).get("/api/v1/users/me");
    expect(res.status).toBe(401);
  });

  it("GET /resources returns 401 with no token", async () => {
    const res = await request(app).get("/api/v1/resources");
    expect(res.status).toBe(401);
  });

  it("GET /bookings returns 401 with no token", async () => {
    const res = await request(app).get("/api/v1/bookings");
    expect(res.status).toBe(401);
  });
});

describe("Role-based authorization middleware", () => {
  const secret = process.env.JWT_SECRET || "test_secret";

  const userToken = jwt.sign({ userId: 1, role: "user" }, secret, {
    expiresIn: "1h",
  });

  const managerToken = jwt.sign({ userId: 2, role: "manager" }, secret, {
    expiresIn: "1h",
  });

  const adminToken = jwt.sign({ userId: 3, role: "admin" }, secret, {
    expiresIn: "1h",
  });

  it("POST /resources with user token -> 403", async () => {
    const res = await request(app)
      .post("/api/v1/resources")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        venueId: 1,
        name: "Room A",
        capacity: 10,
        resourceType: "room",
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("POST /resources with manager token -> 403", async () => {
    const res = await request(app)
      .post("/api/v1/resources")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        venueId: 1,
        name: "Room A",
        capacity: 10,
        resourceType: "room",
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("POST /resources with admin token -> not 403", async () => {
    const res = await request(app)
      .post("/api/v1/resources")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        venueId: 1,
        name: "Room A",
        capacity: 10,
        resourceType: "room",
      });

    expect(res.status).not.toBe(403);
  });

  it("POST /bookings/:id/approve with user token -> 403", async () => {
    const res = await request(app)
      .post("/api/v1/bookings/1/approve")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("POST /bookings/:id/reject with user token -> 403", async () => {
    const res = await request(app)
      .post("/api/v1/bookings/1/reject")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("POST /bookings/:id/approve with manager token -> not 403", async () => {
    const res = await request(app)
      .post("/api/v1/bookings/1/approve")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).not.toBe(403);
  });

  it("GET /users/me with valid user token -> not 401/403", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  }, 10000);
});
