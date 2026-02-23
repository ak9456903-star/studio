
'use client';

import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Fingerprint, ShieldCheck, Zap } from 'lucide-react';

type SplashStage = 'INITIAL' | 'TEXT_REVEAL' | 'SCANNING' | 'VERIFIED' | 'FINISHED';

export function SplashScreen() {
  const [stage, setStage] = useState<SplashStage>('INITIAL');
  const [isVisible, setIsVisible] = useState(true);

  const splashImg = PlaceHolderImages.find(img => img.id === 'splash-image');

  useEffect(() => {
    // 3 Seconds: Lightning strike hits and text appears
    const timer1 = setTimeout(() => setStage('TEXT_REVEAL'), 3000);

    // 5 Seconds: Fingerprint hologram scanning
    const timer2 = setTimeout(() => setStage('SCANNING'), 5000);

    // 6 Seconds: Identity Verified
    const timer3 = setTimeout(() => setStage('VERIFIED'), 6000);

    // 7 Seconds: Start fade out and finish
    const timer4 = setTimeout(() => {
        setStage('FINISHED');
        setTimeout(() => setIsVisible(false), 500); // Wait for transition
    }, 7000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  if (!isVisible || !splashImg) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-1000 ease-in-out",
        stage === 'FINISHED' ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Background Image with Lightning/Flash Effect */}
        <div className={cn(
            "absolute inset-0 transition-all duration-700",
            stage === 'INITIAL' ? "scale-110 blur-sm brightness-50" : "scale-100 blur-0 brightness-100"
        )}>
            <NextImage
                src={splashImg.imageUrl}
                alt="Splash Screen"
                fill
                className="object-cover"
                priority
                data-ai-hint={splashImg.imageHint}
            />
            {/* Dynamic Overlays */}
            <div className={cn(
                "absolute inset-0 bg-primary/5 transition-opacity duration-300",
                stage === 'INITIAL' ? "opacity-100" : "opacity-0"
            )} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        </div>

        {/* Cinematic Elements Container */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 w-full max-w-md">
            
            {/* Stage 1 & 2: DASHI Text Reveal */}
            <div className={cn(
                "transition-all duration-1000 transform",
                stage === 'INITIAL' ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            )}>
                <h1 className="text-6xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_15px_rgba(0,212,255,0.8)]">
                    DASHI
                </h1>
                <p className="text-primary font-medium tracking-[0.5em] mt-2 uppercase text-xs animate-pulse">
                    Content Creator AI
                </p>
            </div>

            {/* Stage 3: Fingerprint Scanning */}
            <div className={cn(
                "mt-12 transition-all duration-500",
                stage === 'SCANNING' ? "opacity-100 scale-110" : "opacity-0 scale-90"
            )}>
                <div className="relative">
                    <Fingerprint className="h-24 w-24 text-primary/60 animate-pulse" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/80 animate-[scan_2s_linear_infinite]" />
                </div>
                <p className="text-primary/70 text-[10px] tracking-widest mt-4 uppercase font-bold">
                    Scanning Identity...
                </p>
            </div>

            {/* Stage 4: Identity Verified */}
            <div className={cn(
                "absolute bottom-24 transition-all duration-500 flex flex-col items-center",
                stage === 'VERIFIED' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 px-6 py-2 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(0,212,255,0.2)]">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-primary text-sm font-bold tracking-widest uppercase">
                        Identity Verified
                    </span>
                </div>
            </div>
            
            {/* Initial Lightning Strikes */}
            {stage === 'INITIAL' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Zap className="h-40 w-40 text-white opacity-20 animate-ping" />
                </div>
            )}
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
