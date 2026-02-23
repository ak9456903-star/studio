
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
    // Stage timings as per Flutter implementation
    const timer1 = setTimeout(() => setStage('TEXT_REVEAL'), 3000); // 3 Seconds: Lightning strike & Text
    const timer2 = setTimeout(() => setStage('SCANNING'), 5000);    // 5 Seconds: Hologram Scanning
    const timer3 = setTimeout(() => setStage('VERIFIED'), 6000);    // 6 Seconds: Identity Verified
    const timer4 = setTimeout(() => {
        setStage('FINISHED');
        setTimeout(() => setIsVisible(false), 800); // Transition buffer
    }, 7500);

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
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        
        {/* Layer 1: Background AI Figure & Lightning Storm */}
        <div className={cn(
            "absolute inset-0 transition-all duration-1000 transform",
            stage === 'INITIAL' ? "scale-110 blur-sm brightness-50" : "scale-100 blur-0 brightness-100"
        )}>
            <NextImage
                src={splashImg.imageUrl}
                alt="Cinematic AI Intro"
                fill
                className="object-cover"
                priority
                data-ai-hint={splashImg.imageHint}
            />
            
            {/* Dark Overlay for Depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
            
            {/* Interactive Lightning Strike Effect at 3s */}
            {stage === 'TEXT_REVEAL' && (
                <div className="absolute inset-0 bg-primary/20 animate-pulse pointer-events-none flex items-center justify-center">
                    <Zap className="h-[80vh] w-[80vw] text-white opacity-10 animate-ping absolute" />
                </div>
            )}
        </div>

        {/* Cinematic Elements Container */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 w-full h-full">
            
            {/* DASHI Text Reveal (3.0s) - Neon Electric Style */}
            <div className={cn(
                "transition-all duration-1000 transform flex flex-col items-center",
                stage === 'INITIAL' ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"
            )}>
                <h1 className="text-7xl font-black tracking-[0.3em] text-white drop-shadow-[0_0_20px_rgba(0,212,255,1)] animate-pulse">
                    DASHI
                </h1>
                <p className="text-primary font-light tracking-[0.6em] mt-4 uppercase text-sm drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">
                    Content Creator AI
                </p>
            </div>

            {/* Fingerprint Hologram Scanning (5.0s) */}
            <div className={cn(
                "mt-16 transition-all duration-700 relative",
                (stage === 'SCANNING' || stage === 'VERIFIED') ? "opacity-100 scale-110" : "opacity-0 scale-75"
            )}>
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
                    <Fingerprint className={cn(
                        "h-28 w-28 transition-colors duration-500",
                        stage === 'VERIFIED' ? "text-green-400" : "text-primary/70"
                    )} />
                    
                    {/* Scanning Line Animation */}
                    {stage === 'SCANNING' && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_15px_rgba(0,212,255,1)] animate-[scan_1.5s_linear_infinite]" />
                    )}
                </div>
                
                <p className={cn(
                    "text-[10px] tracking-[0.4em] mt-6 uppercase font-bold transition-all duration-500",
                    stage === 'VERIFIED' ? "text-green-400" : "text-primary/60"
                )}>
                    {stage === 'VERIFIED' ? 'Access Granted' : 'Scanning Bio-Matrix...'}
                </p>
            </div>

            {/* Identity Verified Reveal (6.0s) */}
            <div className={cn(
                "absolute bottom-32 transition-all duration-700 flex flex-col items-center",
                stage === 'VERIFIED' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )}>
                <div className="flex items-center gap-3 bg-black/40 border border-primary/40 px-8 py-3 rounded-full backdrop-blur-xl shadow-[0_0_30px_rgba(0,212,255,0.3)]">
                    <ShieldCheck className="h-6 w-6 text-green-400" />
                    <span className="text-white text-sm font-bold tracking-widest uppercase">
                        Identity Verified
                    </span>
                </div>
            </div>
            
            {/* Lightning Flashes during initial seconds */}
            {stage === 'INITIAL' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 animate-pulse" />
                </div>
            )}
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
