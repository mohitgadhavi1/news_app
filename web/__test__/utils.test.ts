import { formatSimpleDate, formatFullDateTime, formatLongDate } from '../lib/utils';

describe('Date formatting utilities', () => {
  const testDate = '2023-10-27T10:30:00Z';

  test('formatSimpleDate returns YYYY-MM-DD', () => {
    const result = formatSimpleDate(testDate);
    // Note: depending on local timezone of the runner, this might vary if not careful,
    // but typically consistent for UTC dates in test environments.
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('formatFullDateTime returns YYYY-MM-DD HH:MM:SS', () => {
    const result = formatFullDateTime(testDate);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  test('formatLongDate returns Month DD, YYYY', () => {
    const d = new Date(testDate);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const expected = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    expect(formatLongDate(testDate)).toBe(expected);
  });

  test('utilities handle invalid dates gracefully', () => {
    expect(formatSimpleDate('invalid')).toBeNull();
    expect(formatFullDateTime('invalid')).toBeNull();
    expect(formatLongDate('invalid')).toBeNull();
  });

  test('utilities handle undefined/null gracefully', () => {
    expect(formatSimpleDate(undefined)).toBeNull();
    expect(formatFullDateTime(undefined)).toBeNull();
    expect(formatLongDate(undefined)).toBeNull();
  });
});
