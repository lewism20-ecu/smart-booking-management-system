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

  it('rejects capacity of 0', async () => {
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

  it('rejects negative capacity', async () => {
    await expect(
      resourceModel.createResource({
        venueId: 1, name: 'Test', capacity: -5,
        resourceType: 'desk'
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
describe('bookingModel — timestamp validation', () => {

  it('rejects invalid startTime string', async () => {
    await expect(
      bookingModel.createBooking(1, 1, 'not-a-date', '2026-04-01T12:00:00Z', false)
    ).rejects.toMatchObject({
      status: 400,
      message: 'startTime is not a valid date.'
    });
  });

  it('rejects invalid endTime string', async () => {
    await expect(
      bookingModel.createBooking(1, 1, '2026-04-01T10:00:00Z', 'not-a-date', false)
    ).rejects.toMatchObject({
      status: 400,
      message: 'endTime is not a valid date.'
    });
  });

  it('rejects both timestamps invalid', async () => {
    await expect(
      bookingModel.createBooking(1, 1, 'bad', 'also-bad', false)
    ).rejects.toMatchObject({
      status: 400,
      message: 'startTime is not a valid date.'
    });
  });

  it('rejects empty string timestamps', async () => {
    await expect(
      bookingModel.createBooking(1, 1, '', '', false)
    ).rejects.toMatchObject({
      status: 400,
      message: 'startTime is not a valid date.'
    });
  });

});

describe('bookingModel — time range validation', () => {

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

  it('accepts valid time range — passes through to DB check', async () => {
    // Valid times pass all pre-DB validation
    // Will throw a DB connection error in test env, not a 400
    await expect(
      bookingModel.createBooking(
        1, 1,
        '2026-04-01T10:00:00Z',
        '2026-04-01T12:00:00Z',
        false
      )
    ).rejects.not.toMatchObject({ status: 400 });
  });

});

describe('bookingModel — status validation', () => {

  it('rejects invalid status in updateBookingStatus', async () => {
    await expect(
      bookingModel.updateBookingStatus(1, 'invalid_status')
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('Invalid status')
    });
  });

  it('rejects pending as a status update value', async () => {
    // pending is the initial state — cannot be set via updateBookingStatus
    await expect(
      bookingModel.updateBookingStatus(1, 'pending')
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('Invalid status')
    });
  });

  it('accepts approved as valid status', async () => {
    // Passes validation — will fail at DB level in test env
    await expect(
      bookingModel.updateBookingStatus(1, 'approved')
    ).rejects.not.toMatchObject({ status: 400 });
  });

  it('accepts rejected as valid status', async () => {
    await expect(
      bookingModel.updateBookingStatus(1, 'rejected')
    ).rejects.not.toMatchObject({ status: 400 });
  });

  it('accepts cancelled as valid status', async () => {
    await expect(
      bookingModel.updateBookingStatus(1, 'cancelled')
    ).rejects.not.toMatchObject({ status: 400 });
  });

});

// ── userModel ─────────────────────────────────────────────────────────────
describe('userModel — role validation', () => {

  it('rejects invalid role in updateUserRole', async () => {
    await expect(
      userModel.updateUserRole(1, 'superuser')
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('Invalid role')
    });
  });

  it('rejects empty string role', async () => {
    await expect(
      userModel.updateUserRole(1, '')
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('Invalid role')
    });
  });

  it('accepts user as valid role', async () => {
    await expect(
      userModel.updateUserRole(1, 'user')
    ).rejects.not.toMatchObject({ status: 400 });
  });

  it('accepts manager as valid role', async () => {
    await expect(
      userModel.updateUserRole(1, 'manager')
    ).rejects.not.toMatchObject({ status: 400 });
  });

  it('accepts admin as valid role', async () => {
    await expect(
      userModel.updateUserRole(1, 'admin')
    ).rejects.not.toMatchObject({ status: 400 });
  });

});

describe('bookingModel — rescheduleBooking timestamp validation', () => {

  it('rejects invalid startTime in rescheduleBooking', async () => {
    await expect(
      bookingModel.rescheduleBooking(1, 'not-a-date', '2026-04-01T12:00:00Z')
    ).rejects.toMatchObject({
      status: 400,
      message: 'startTime is not a valid date.'
    });
  });

  it('rejects invalid endTime in rescheduleBooking', async () => {
    await expect(
      bookingModel.rescheduleBooking(1, '2026-04-01T10:00:00Z', 'not-a-date')
    ).rejects.toMatchObject({
      status: 400,
      message: 'endTime is not a valid date.'
    });
  });

  it('rejects startTime after endTime in rescheduleBooking', async () => {
    await expect(
      bookingModel.rescheduleBooking(
        1,
        '2026-04-01T12:00:00Z',
        '2026-04-01T10:00:00Z'
      )
    ).rejects.toMatchObject({
      status: 400,
      message: 'startTime must be before endTime.'
    });
  });

});
