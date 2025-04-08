import React from 'react';
import { Button } from '@/components/ui/button';
import { Sun } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  // Add your theme toggle logic here
  return (
    <Button variant="ghost" size="icon" title="Toggle Theme">
      <Sun size={20} />
    </Button>
  );
};