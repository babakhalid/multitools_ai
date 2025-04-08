'use client';

import { Button } from '../ui/button';

export function ServiceSelector({ services, onSelect }) {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-100">
      <h3>Select a Service</h3>
      {services.map((service) => (
        <Button key={service.id} onClick={() => onSelect(service)}>
          {service.name}
        </Button>
      ))}
    </div>
  );
}