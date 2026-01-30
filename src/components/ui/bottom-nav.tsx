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

    if (!user && !isUserLoading) {
      return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-sm border-t border-border flex justify-around items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
            const isActive = item.href === '/' ? pathname === item.href : pathname.startsWith(item.href);
            
            const className = "flex flex-col items-center justify-center gap-1 text-muted-foreground h-full rounded-lg px-1 text-center w-1/3";
            
            const children = (
                <>
                    <item.icon className={cn('h-6 w-6 transition-colors', isActive ? 'text-primary' : 'text-foreground/60')} />
                    <span className={cn('text-xs font-medium transition-colors leading-tight',  isActive ? 'text-primary' : 'text-foreground/60')}>
                    {item.label}
                    </span>
                </>
            );

            return (
                <Link key={item.href} href={item.href} className={className}>
                    {children}
                </Link>
            );
        })}
        </nav>
    );
}
