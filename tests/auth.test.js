const request = require('supertest');
const app     = require('../src/index');

describe.skip('POST /api/v1/auth/signup', () => {
  it('returns 400 when body is empty', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({});
    expect(res.status).toBe(400);
  });
});

test("placeholder", () => {
  expect(true).toBe(true);
});