'use client';

import Link from 'next/link';
import { Home, MessageCircle, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  // Don't show nav if we are sure the user is not logged in
  if (!user && !isUserLoading) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-xl border-t border-primary/10 flex justify-around items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
      {navItems.map((item) => {
        const isActive = item.href === '/' 
          ? pathname === '/' 
          : pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className="flex flex-col items-center justify-center gap-1 w-1/3 h-full transition-all duration-300"
          >
            <div className={cn(
              "p-1.5 rounded-xl transition-all duration-300",
              isActive ? "bg-primary/20 scale-110" : "bg-transparent"
            )}>
              <item.icon className={cn(
                'h-5 w-5 transition-colors', 
                isActive ? 'text-primary' : 'text-muted-foreground'
              )} />
            </div>
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-tighter transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
