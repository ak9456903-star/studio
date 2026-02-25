
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, History, User, Clapperboard } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/history', icon: History, label: 'History' },
  { href: '/profile', icon: User, label: 'Account' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isUserLoading || !user) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-2xl border-t border-primary/10 flex justify-around items-center z-50 px-4">
      {navItems.map((item) => {
        const isActive = item.href === '/' 
          ? pathname === '/' 
          : pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className="flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-full"
          >
            <div className={cn(
              "p-2 rounded-2xl transition-all duration-300",
              isActive ? "bg-primary text-black shadow-lg shadow-primary/30 scale-110" : "bg-transparent text-zinc-500 hover:text-white"
            )}>
              <item.icon className="h-6 w-6" />
            </div>
            <span className={cn(
              'text-[9px] font-black uppercase tracking-widest transition-colors',
              isActive ? 'text-primary' : 'text-zinc-500'
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
