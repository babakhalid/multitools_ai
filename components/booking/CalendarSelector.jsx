'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';

export function CalendarSelector({ service, holidays, onSelect, onFetchHolidays }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDays, setAvailableDays] = useState([]);

  useEffect(() => {
    if (service.availableDays) {
      setAvailableDays(service.availableDays.map(Number)); // Convert to integers
    }
    if (!holidays) {
      onFetchHolidays(); // Trigger holiday fetch if not provided
    }
  }, [service, holidays, onFetchHolidays]);

  // Generate next 14 days (two weeks, matching Flutter's CalendarFormat.twoWeeks)
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  });

  const isHoliday = (date) => {
    return holidays?.some((h) => h.date.split('T')[0] === date && h.isOff);
  };

  const isServiceDay = (date) => {
    const dayOfWeek = new Date(date).getDay() + 1; // 1 = Monday, 7 = Sunday
    return availableDays.includes(dayOfWeek);
  };

  const handleDateClick = (date) => {
    if (isHoliday(date)) {
      const holiday = holidays.find((h) => h.date.split('T')[0] === date);
      alert(`Unavailable: ${holiday.description}`);
    } else if (!isServiceDay(date)) {
      alert('Service not available on this day');
    } else {
      setSelectedDate(date);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-100">
      <h3>Select a Date</h3>
      <div className="grid grid-cols-2 gap-2">
        {dates.map((date) => (
          <Button
            key={date}
            onClick={() => handleDateClick(date)}
            variant={selectedDate === date ? 'default' : 'outline'}
            disabled={isHoliday(date) || !isServiceDay(date)}
          >
            {date}
          </Button>
        ))}
      </div>
      <Button onClick={() => onSelect(selectedDate)} disabled={!selectedDate}>
        Next
      </Button>
    </div>
  );
}