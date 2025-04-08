import { tool } from 'ai';
import { z } from 'zod';

// Sign-in tool for Campus+ authentication
export const signIn = tool({
  description: 'Authenticate user with Campus+ system',
  parameters: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
  execute: async ({ email, password }) => {
    const response = await fetch('https://campus-api.um6p.ma/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok && data.token) {
      return { success: true, userId: data.userId, token: data.token };
    } else {
      throw new Error(data.message || 'Authentication failed');
    }
  },
});

// Get services tool to fetch available services using the token
export const getServices = tool({
  description: 'Fetch list of services from Campus+ system',
  parameters: z.object({
    token: z.string(),
  }),
  execute: async ({ token }) => {
    const response = await fetch('https://campus-api.um6p.ma/api/service/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ page: '1' }), // Default to page 1
    });
    const data = await response.json();
    if (response.ok && data.data) {
      return {
        success: true,
        services: data.data.map((service: any) => ({
          id: service.id,
          name: service.name,
          availableDays: service.availabledays || [],
        })),
      };
    } else {
      throw new Error(data.message || 'Failed to fetch services');
    }
  },
});

// Fetch holidays/day-offs
export const getHolidays = tool({
  description: 'Fetch holiday/day-off data from Campus+',
  parameters: z.object({
    token: z.string(),
  }),
  execute: async ({ token }) => {
    const response = await fetch('https://campus-api.um6p.ma/api/holiday/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    if (response.ok) {
      return {
        success: true,
        holidays: data.map((holiday: any) => ({
          date: holiday.date,
          description: holiday.description,
          isOff: holiday.isOff === '1',
        })),
      };
    } else {
      throw new Error(data.message || 'Failed to fetch holidays');
    }
  },
});

// Fetch timeslots for a service on a specific date
export const getTimeSlots = tool({
  description: 'Fetch available timeslots for a service on a specific date',
  parameters: z.object({
    token: z.string(),
    serviceId: z.string(),
    date: z.string(), // ISO date string
  }),
  execute: async ({ token, serviceId, date }) => {
    const response = await fetch(`https://campus-api.um6p.ma/api/prestation/timeslotes/${serviceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        page: '1',
        date_start: date,
        date_end: date,
      }),
    });
    const data = await response.json();
    if (response.ok && data.data) {
      return {
        success: true,
        timeslots: data.data.map((slot: any) => ({
          id: slot.id,
          timeStart: slot.timeStart,
          timeEnd: slot.timeEnd,
          canBook: slot.canbook,
          capacity: slot.capacity,
          reserved: slot.number,
        })),
      };
    } else {
      throw new Error(data.message || 'Failed to fetch timeslots');
    }
  },
});

// Book service tool (simulated, replace with actual endpoint)
export const bookService = tool({
  description: 'Book a service with Campus+ system',
  parameters: z.object({
    userId: z.string(),
    token: z.string(),
    serviceId: z.string(),
    date: z.string(), // ISO date string (e.g., "2025-03-25")
    timeSlotId: z.string(),
  }),
  execute: async ({ userId, token, serviceId, date, timeSlotId }) => {
    const response = await fetch('https://campus-api.um6p.ma/api/booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        serviceId,
        date,
        timeSlotId,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, bookingId: data.bookingId || 'simulated-id' };
    } else {
      throw new Error(data.message || 'Booking failed');
    }
  },
});