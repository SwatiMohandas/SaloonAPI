"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Scissors, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-primary hover:opacity-90 transition">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                <Scissors size={24} />
              </div>
              <span>Saloon<span className="text-foreground">App</span></span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
              <ThemeToggle />
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-6 mr-4">
                    {user.role === 'customer' && (
                        <Link href="/dashboard/customer" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                            My Bookings
                        </Link>
                    )}
                    {user.role === 'owner' && (
                        <Link href="/dashboard/owner" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                           Manage Shop
                        </Link>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="text-sm text-right hidden sm:block">
                        <div className="font-medium leading-none">{user.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={logout}>
                        Logout
                    </Button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" asChild>
                    <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                    <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    return (
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
