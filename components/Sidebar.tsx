// components/Sidebar.tsx
import React from 'react';
import { cn } from '@/lib/utils'; // Assuming you have this utility
import { Button } from '@/components/ui/button'; // Adjust path as needed
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { AboutButton } from '@/components/AboutButton'; // Adjust path
import { ThemeToggle } from '@/components/ThemeToggle'; // Adjust path

interface SidebarProps {
  // Add any props you might need
}

export const Sidebar: React.FC<SidebarProps> = () => {
  return (
    <div className={cn(
      "fixed top-0 left-0 h-screen w-64 z-[60] flex flex-col justify-between p-4",
      "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      {/* Top Section - Logo and Chat History */}
      <div className="flex flex-col gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/">
            <div className="text-xl font-bold">YourApp</div> {/* Replace with your logo */}
          </Link>
        </div>

        {/* New Chat Button / Chat History */}
        <Link href="/new">
          <Button
            type="button"
            variant={'secondary'}
            className="w-full rounded-full bg-accent hover:bg-accent/80 backdrop-blur-sm group transition-all hover:scale-105 pointer-events-auto"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-all" />
            <span className="text-sm ml-2 group-hover:block hidden animate-in fade-in duration-300">
              New Chat
            </span>
          </Button>
        </Link>

        {/* You can add chat history component here */}
        <div className="flex-1 overflow-y-auto">
          {/* Add your chat history list component here */}
        </div>
      </div>

      {/* Bottom Section - User Profile */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <AboutButton />
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2">
          {/* User Profile */}
          <div className="w-10 h-10 rounded-full bg-gray-200" /> {/* Avatar placeholder */}
          <div className="flex-1">
            <p className="text-sm font-medium">Username</p>
            <p className="text-xs text-muted-foreground">user@email.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};