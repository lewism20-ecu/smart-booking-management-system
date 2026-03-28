// Model unit tests
// These test validation logic that does not require a DB connection

const resourceModel = require('../src/models/resourceModel');
const bookingModel  = require('../src/models/bookingModel');
const userModel     = require('../src/models/userModel');

// ── resourceModel ─────────────────────────────────────────────────────────
describe('resourceModel — schema constraint validation', () => {

  it('rejects invalid resourceType without hitting DB', async () => {
    await expect(
      resourceModel.createResource({
        venueId: 1, name: 'Test', capacity: 5,
        resourceType: 'invalid_type'
      })
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('Invalid resourceType')
    });
  });

  it('rejects capacity less than 1 without hitting DB', async () => {
    await expect(
      resourceModel.createResource({
        venueId: 1, name: 'Test', capacity: 0,
        resourceType: 'room'
      })
    ).rejects.toMatchObject({
      status: 400,
      message: 'Capacity must be greater than 0.'
    });
  });

  it('VALID_TYPES contains all four expected types', () => {
    expect(resourceModel.VALID_TYPES).toEqual(
      expect.arrayContaining(['seat', 'room', 'desk', 'hybrid'])
    );
    expect(resourceModel.VALID_TYPES).toHaveLength(4);
  });

});

// ── bookingModel ──────────────────────────────────────────────────────────
describe('bookingModel — schema constraint validation', () => {

  it('rejects booking where startTime equals endTime', async () => {
    const time = '2026-04-01T10:00:00Z';
    await expect(
      bookingModel.createBooking(1, 1, time, time, false)
    ).rejects.toMatchObject({
      status: 400,
      message: 'startTime must be before endTime.'
    });
  });

  it('rejects booking where startTime is after endTime', async () => {
    await expect(
      bookingModel.createBooking(
        1, 1,
        '2026-04-01T12:00:00Z',
        '2026-04-01T10:00:00Z',
        false
      )
    ).rejects.toMatchObject({
      status: 400,
      message: 'startTime must be before endTime.'
    });
  });

  it('rejects invalid status in updateBookingStatus', async () => {
    await expect(
      bookingModel.updateBookingStatus(1, 'invalid_status')
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('Invalid status')
    });
  });

});

// ── userModel ─────────────────────────────────────────────────────────────
describe('userModel — schema constraint validation', () => {

  it('rejects invalid role in updateUserRole', async () => {
    await expect(
      userModel.updateUserRole(1, 'superuser')
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('Invalid role')
    });
  });

});
