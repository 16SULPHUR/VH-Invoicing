import { daysUntil, rupees } from "./shopTools";

export const BOOKING_STATUSES = [
  { value: "booked", label: "Booked", tone: "indigo" },
  { value: "ready", label: "Ready", tone: "leaf" },
  { value: "picked_up", label: "Picked up", tone: "neutral" },
  { value: "cancelled", label: "Cancelled", tone: "red" },
];

export const bookingStatus = (status) => BOOKING_STATUSES.find(({ value }) => value === status) ?? BOOKING_STATUSES[0];

export const isOpenBooking = (booking) => booking.status === "booked" || booking.status === "ready";

export const bookingBalance = (booking) => Math.max(0, rupees(booking.total) - rupees(booking.advance));

export const isLateBooking = (booking) => isOpenBooking(booking) && (daysUntil(booking.pickup_on) ?? 0) < 0;
