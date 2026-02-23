
'use client';

import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  const splashImg = PlaceHolderImages.find(img => img.id === 'splash-image');

  useEffect(() => {
    // Show splash for 2.5 seconds then start fade
    const timer = setTimeout(() => {
      setIsFading(true);
      // Remove from DOM after fade animation (0.5s)
      setTimeout(() => setIsVisible(false), 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible || !splashImg) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-500 ease-in-out",
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="relative w-full h-full flex items-center justify-center p-8">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-primary/10 blur-[100px] animate-pulse" />
        
        <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-3xl border-2 border-primary/30 shadow-[0_0_50px_rgba(0,212,255,0.3)] animate-in zoom-in-95 duration-700">
          <NextImage
            src={splashImg.imageUrl}
            alt="Splash Screen"
            fill
            className="object-cover"
            priority
            data-ai-hint={splashImg.imageHint}
          />
          
          {/* Lightning Overlay Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          
          <div className="absolute bottom-12 left-0 right-0 text-center">
            <h2 className="text-2xl font-bold tracking-[0.3em] text-primary animate-pulse uppercase">
              Initializing...
            </h2>
            <div className="mt-4 mx-auto w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-[loading_2.5s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
