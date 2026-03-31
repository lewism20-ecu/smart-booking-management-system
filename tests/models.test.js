const resourceModel = require('../src/models/resourceModel');
const bookingModel  = require('../src/models/bookingModel');
const userModel     = require('../src/models/userModel');

// ── resourceModel ─────────────────────────────────────────────────────────
describe('resourceModel — schema constraint validation', () => {

  it('rejects invalid resourceType', async () => {
    await expect(
      resourceModel.createResource({
        venueId: 1, name: 'Test', capacity: 5, resourceType: 'invalid'
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects capacity of 0', async () => {
    await expect(
      resourceModel.createResource({
        venueId: 1, name: 'Test', capacity: 0, resourceType: 'room'
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects negative capacity', async () => {
    await expect(
      resourceModel.createResource({
        venueId: 1, name: 'Test', capacity: -5, resourceType: 'desk'
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('VALID_TYPES contains all four types', () => {
    expect(resourceModel.VALID_TYPES).toEqual(
      expect.arrayContaining(['seat', 'room', 'desk', 'hybrid'])
    );
    expect(resourceModel.VALID_TYPES).toHaveLength(4);
  });

});

// ── bookingModel timestamp validation ─────────────────────────────────────
describe('bookingModel — timestamp validation', () => {

  it('rejects invalid startTime string', async () => {
    await expect(
      bookingModel.createBooking(1, 1, 'not-a-date', '2026-04-01T12:00:00Z', false)
    ).rejects.toMatchObject({ status: 400, message: 'startTime is not a valid date.' });
  });

  it('rejects invalid endTime string', async () => {
    await expect(
      bookingModel.createBooking(1, 1, '2026-04-01T10:00:00Z', 'not-a-date', false)
    ).rejects.toMatchObject({ status: 400, message: 'endTime is not a valid date.' });
  });

  it('rejects empty string timestamps', async () => {
    await expect(
      bookingModel.createBooking(1, 1, '', '', false)
    ).rejects.toMatchObject({ status: 400, message: 'startTime is not a valid date.' });
  });

});

// ── bookingModel time range validation ────────────────────────────────────
describe('bookingModel — time range validation', () => {

  it('rejects startTime equal to endTime', async () => {
    const time = '2026-04-01T10:00:00Z';
    await expect(
      bookingModel.createBooking(1, 1, time, time, false)
    ).rejects.toMatchObject({ status: 400, message: 'startTime must be before endTime.' });
  });

  it('rejects startTime after endTime', async () => {
    await expect(
      bookingModel.createBooking(1, 1, '2026-04-01T12:00:00Z', '2026-04-01T10:00:00Z', false)
    ).rejects.toMatchObject({ status: 400, message: 'startTime must be before endTime.' });
  });

});

// ── bookingModel status validation ────────────────────────────────────────
describe('bookingModel — status validation', () => {

  it('rejects invalid status', async () => {
    await expect(
      bookingModel.updateBookingStatus(1, 'invalid_status')
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects pending as an update status', async () => {
    await expect(
      bookingModel.updateBookingStatus(1, 'pending')
    ).rejects.toMatchObject({ status: 400 });
  });

});

// ── bookingModel reschedule validation ────────────────────────────────────
describe('bookingModel — rescheduleBooking timestamp validation', () => {

  it('rejects invalid startTime in rescheduleBooking', async () => {
    await expect(
      bookingModel.rescheduleBooking(1, 'not-a-date', '2026-04-01T12:00:00Z')
    ).rejects.toMatchObject({ status: 400, message: 'startTime is not a valid date.' });
  });

  it('rejects invalid endTime in rescheduleBooking', async () => {
    await expect(
      bookingModel.rescheduleBooking(1, '2026-04-01T10:00:00Z', 'not-a-date')
    ).rejects.toMatchObject({ status: 400, message: 'endTime is not a valid date.' });
  });

  it('rejects startTime after endTime in rescheduleBooking', async () => {
    await expect(
      bookingModel.rescheduleBooking(1, '2026-04-01T12:00:00Z', '2026-04-01T10:00:00Z')
    ).rejects.toMatchObject({ status: 400, message: 'startTime must be before endTime.' });
  });

});

// ── userModel role validation ─────────────────────────────────────────────
describe('userModel — role validation', () => {

  it('rejects invalid role', async () => {
    await expect(
      userModel.updateUserRole(99999, 'superuser')
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects empty string role', async () => {
    await expect(
      userModel.updateUserRole(99999, '')
    ).rejects.toMatchObject({ status: 400 });
  });

  it('valid role passes validation — nonexistent user gets 404 not 400', async () => {
    await expect(
      userModel.updateUserRole(99999, 'user')
    ).rejects.toMatchObject({ status: 404 });
  });

  it('manager role passes validation — nonexistent user gets 404 not 400', async () => {
    await expect(
      userModel.updateUserRole(99999, 'manager')
    ).rejects.toMatchObject({ status: 404 });
  });

  it('admin role passes validation — nonexistent user gets 404 not 400', async () => {
    await expect(
      userModel.updateUserRole(99999, 'admin')
    ).rejects.toMatchObject({ status: 404 });
  });

});
