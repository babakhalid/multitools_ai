'use client';

export function BookingConfirmation({ bookingDetails }) {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-green-100">
      <h3>Booking Confirmed!</h3>
      <p>Service: {bookingDetails.service}</p>
      <p>Date: {bookingDetails.date}</p>
      <p>Time: {bookingDetails.timeStart} - {bookingDetails.timeEnd}</p>
      <p>Booking ID: {bookingDetails.bookingId}</p>
    </div>
  );
}