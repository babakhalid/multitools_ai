import React from 'react';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

export const AboutButton: React.FC = () => {
  return (
    <Button variant="ghost" size="icon" title="About">
      <Info size={20} />
    </Button>
  );
};