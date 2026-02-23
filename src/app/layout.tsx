
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from '@/components/ui/bottom-nav';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SplashScreen } from '@/components/SplashScreen';
import Script from 'next/script';
import NextImage from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const metadata: Metadata = {
  title: 'Desi Content Creator',
  description: 'An all-in-one AI content generator for Indian users.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bgImage = PlaceHolderImages.find(img => img.id === 'cyber-background');

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-app-pub-6437039380428423"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body className="font-body antialiased relative min-h-screen">
        <FirebaseClientProvider>
          <SplashScreen />
          
          {/* Global Background Image */}
          {bgImage && (
            <div className="fixed inset-0 z-[-2] pointer-events-none">
              <NextImage
                src={bgImage.imageUrl}
                alt="Background"
                fill
                className="object-cover opacity-30"
                priority
                data-ai-hint={bgImage.imageHint}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
            </div>
          )}

          <div className="relative z-0 min-h-screen pb-16">
            {children}
          </div>
          <BottomNav />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
