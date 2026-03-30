const request = require("supertest");
const app = require("../src/index");
const { pool } = require("../src/db/index");

const TEST_EMAIL = "authtest@example.com";
const TEST_PASSWORD = "StrongPass123!";

// bcrypt is slow — increase timeout for this suite
jest.setTimeout(15000);

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email = $1", [TEST_EMAIL]);
  await pool.end();
});

// ─── Signup ───────────────────────────────────────────────────────────────────

describe("POST /api/v1/auth/signup", () => {
  it("201 — creates a user and returns a token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.user.role).toBe("user");
  });

  it("409 — duplicate email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Conflict");
  });

  it("400 — missing email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ password: TEST_PASSWORD });

    expect(res.status).toBe(400);
  });

  it("400 — missing password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email: "another@example.com" });

    expect(res.status).toBe(400);
  });

  it("400 — weak password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email: "weak@example.com", password: "weak" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Weak password");
  });

  it("400 — empty body", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send({});

    expect(res.status).toBe(400);
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe("POST /api/v1/auth/login", () => {
  it("200 — valid credentials return a token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it("401 — wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: "WrongPass999!" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("401 — email not found", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@example.com", password: TEST_PASSWORD });

    expect(res.status).toBe(401);
  });

  it("400 — missing email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ password: TEST_PASSWORD });

    expect(res.status).toBe(400);
  });

  it("400 — missing password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL });

    expect(res.status).toBe(400);
  });
});
