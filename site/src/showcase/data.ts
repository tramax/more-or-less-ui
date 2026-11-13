import { fromDate, toDate, today, type LocalDate } from 'more-or-less-ui';

/** A date `days` from today, as a local date: the data stays upcoming whenever the page is opened. */
export function inDays(days: number): LocalDate {
  const date = toDate(today());
  date.setDate(date.getDate() + days);
  return fromDate(date);
}

/** "Thu 14 Nov", in the reader's language. */
export const formatDay = (date: LocalDate) =>
  toDate(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

/** The studio runs on Thursdays. Used by the date field and the calendar, so they agree. */
export const isNotThursday = (date: LocalDate) => toDate(date).getDay() !== 4;

export const CLASSES = [
  { value: 'wheel', label: 'Wheel throwing', description: 'Centre, pull, shape. Four weeks.' },
  { value: 'hand', label: 'Hand building', description: 'Coils, slabs and pinch pots.' },
  { value: 'glaze', label: 'Glazing', description: 'Colour and finish for pieces you have made.' },
  { value: 'kids', label: 'Kids’ clay', description: 'Ages 7 to 11, with a grown-up nearby.' },
];

export type Booking = {
  id: string;
  className: string;
  date: LocalDate;
  status: 'Confirmed' | 'Waitlist';
  price: number;
};

export const BOOKINGS: Booking[] = [
  { id: 'b1', className: 'Wheel throwing', date: inDays(3), status: 'Confirmed', price: 48 },
  { id: 'b2', className: 'Glazing', date: inDays(10), status: 'Confirmed', price: 36 },
  { id: 'b3', className: 'Hand building', date: inDays(17), status: 'Waitlist', price: 42 },
  { id: 'b4', className: 'Wheel throwing', date: inDays(24), status: 'Confirmed', price: 48 },
  { id: 'b5', className: 'Kids’ clay', date: inDays(31), status: 'Confirmed', price: 30 },
  { id: 'b6', className: 'Glazing', date: inDays(38), status: 'Waitlist', price: 36 },
  { id: 'b7', className: 'Hand building', date: inDays(45), status: 'Confirmed', price: 42 },
  { id: 'b8', className: 'Wheel throwing', date: inDays(52), status: 'Confirmed', price: 48 },
  { id: 'b9', className: 'Kids’ clay', date: inDays(59), status: 'Confirmed', price: 30 },
];
