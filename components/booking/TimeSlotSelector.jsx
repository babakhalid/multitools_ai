'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';

export function TimeSlotSelector({ serviceId, date, token, onSelect, onFetchTimeSlots }) {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [timeslots, setTimeslots] = useState([]);

  useEffect(() => {
    onFetchTimeSlots(serviceId, date); // Fetch timeslots when component mounts
  }, [serviceId, date, onFetchTimeSlots]);

  const handleTimeSlotSelect = (slot) => {
    if (slot.canBook) {
      setSelectedTimeSlot(slot);
    } else {
      alert('This timeslot is fully booked');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-100">
      <h3>Select a Time Slot</h3>
      {timeslots.map((slot) => (
        <Button
          key={slot.id}
          onClick={() => handleTimeSlotSelect(slot)}
          variant={selectedTimeSlot?.id === slot.id ? 'default' : 'outline'}
          disabled={!slot.canBook}
        >
          {`${slot.timeStart} - ${slot.timeEnd} (${slot.capacity - slot.reserved} available)`}
        </Button>
      ))}
      <Button onClick={() => onSelect(selectedTimeSlot)} disabled={!selectedTimeSlot}>
        Next
      </Button>
    </div>
  );
}