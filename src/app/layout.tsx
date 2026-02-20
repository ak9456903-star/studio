import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from '@/components/ui/bottom-nav';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Desi Content Creator',
  description: 'An all-in-one AI content generator for Indian users.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* AdMob / AdSense Script Integration */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6437039380428423"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <div className="relative min-h-screen pb-16">
            {children}
          </div>
          <BottomNav />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
