'use client';

import Link from 'next/link';
import { Home, MessageCircle, PlusSquare, History, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/', icon: PlusSquare, label: 'Create' },
  { href: '#history', icon: History, label: 'History' },
  { href: '#profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
    const pathname = usePathname();
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-sm border-t border-border flex justify-around items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
            const isActive = (pathname === '/' && item.label === 'Home') || (pathname !== '/' && item.href === pathname);
            
            const className = "flex flex-col items-center justify-center gap-1 text-muted-foreground w-1/5 h-full rounded-lg";
            
            const children = (
                <>
                    <item.icon className={cn('h-6 w-6 transition-colors', isActive ? 'text-accent' : 'text-foreground/60')} />
                    <span className={cn('text-xs font-medium transition-colors',  isActive ? 'text-accent' : 'text-foreground/60')}>
                    {item.label}
                    </span>
                </>
            );

            if (item.href.startsWith('#')) {
                return (
                    <a key={item.label} href={item.href} className={className}>
                        {children}
                    </a>
                );
            }

            return (
                <Link key={item.label} href={item.href} className={className}>
                    {children}
                </Link>
            );
        })}
        </nav>
    );
}
