'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Loader2, 
  Sparkles, 
  Video, 
  Zap, 
  ChevronRight,
  Instagram,
  Clapperboard,
  Hash,
  Quote,
  Image as ImageIcon,
  Youtube,
  Gift,
  Coins
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const mainActions = [
  {
    name: 'Create image',
    icon: <ImageIcon className="h-5 w-5 text-yellow-500" />,
    href: '/image-creator',
  },
  {
    name: 'Create video',
    icon: <Video className="h-5 w-5 text-blue-400" />,
    href: '/video-creator',
  },
  {
    name: 'Viral analysis',
    icon: <Sparkles className="h-5 w-5 text-purple-400" />,
    href: '/chat?mode=analyze',
  },
  {
    name: 'Fast chat',
    icon: <Zap className="h-5 w-5 text-yellow-400" />,
    href: '/chat?mode=fast',
  },
];

const secondaryTools = [
  {
    category: 'Social Media Powerups',
    icon: <Youtube className="h-5 w-5" />,
    tasks: [
      {
        name: 'Instagram Caption',
        description: 'Generate viral captions for your posts.',
        icon: <Instagram className="h-6 w-6 text-pink-500" />,
        href: '/chat?mode=fast',
      },
      {
        name: 'YouTube Title',
        description: 'Get click-worthy titles for your videos.',
        icon: <Clapperboard className="h-6 w-6 text-red-500" />,
        href: '/chat?mode=fast',
      },
      {
        name: 'Hashtag Generator',
        description: 'Find the best hashtags to boost reach.',
        icon: <Hash className="h-6 w-6 text-blue-500" />,
        href: '/chat?mode=fast',
      },
      {
        name: 'Motivation/Bhakti',
        description: 'Inspirational quotes in simple Hindi.',
        icon: <Quote className="h-6 w-6 text-orange-500" />,
        href: '/chat?mode=fast',
      },
    ],
  },
];

export default function CreatePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isAdLoading, setIsAdLoading] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleWatchAd = () => {
    setIsAdLoading(true);
    // Simulate Ad Loading and Reward
    setTimeout(() => {
      setIsAdLoading(false);
      toast({
        title: "Reward Claimed! 🎁",
        description: "You've earned 10 Viral Credits for premium analysis.",
      });
    }, 2500);
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = user.displayName?.split(' ')[0] || 'Creator';

  return (
    <main className="min-h-screen bg-black text-white p-6 pb-24">
      {/* Greeting Section */}
      <div className="mt-8 mb-8">
        <h2 className="text-2xl font-medium text-gray-300">Hi {firstName}</h2>
        <h1 className="text-4xl font-bold mt-2 text-white">Where should we start?</h1>
      </div>

      {/* Ad Placement (Open App Ad) */}
      <div className="mb-10 p-4 bg-zinc-900/40 border border-zinc-800 rounded-3xl text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2 font-bold relative z-10">Advertisement</p>
        <div className="h-24 flex flex-col items-center justify-center text-zinc-500 italic text-xs gap-1 relative z-10">
          <Zap className="h-4 w-4 text-zinc-700 mb-1" />
          <span>Ads by Google</span>
          <span className="text-[8px] opacity-40">Unit: 2652653143</span>
        </div>
      </div>

      {/* Rewarded Ad Section */}
      <Card className="mb-10 bg-gradient-to-br from-primary/20 via-background to-accent/20 border-primary/30 rounded-3xl overflow-hidden shadow-2xl">
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-2xl animate-pulse">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Watch & Earn
                <span className="flex items-center gap-1 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  <Coins className="h-3 w-3" />
                  +10 Credits
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Watch a quick ad to unlock Premium Viral Analysis.
              </p>
            </div>
          </div>
          <Button 
            onClick={handleWatchAd} 
            disabled={isAdLoading}
            className="rounded-2xl px-6 font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            {isAdLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Watch Now'}
          </Button>
        </CardContent>
      </Card>

      {/* Main Action Chips Grid */}
      <div className="grid grid-cols-2 gap-4 mb-12">
        {mainActions.map((action) => (
          <button
            key={action.name}
            onClick={() => action.href && router.push(action.href)}
            className="flex items-center gap-3 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/50 py-4 px-5 rounded-3xl transition-all active:scale-95 text-left group"
          >
            <div className="shrink-0">
              {action.icon}
            </div>
            <span className="font-medium text-gray-100 group-hover:text-white truncate">
              {action.name}
            </span>
          </button>
        ))}
      </div>

      {/* Secondary Tools Section */}
      <div className="space-y-8">
        {secondaryTools.map((category) => (
          <div key={category.category}>
            <div className="flex items-center gap-2 mb-4 px-2">
               <h3 className="text-lg font-semibold text-zinc-400">{category.category}</h3>
            </div>
            <div className="space-y-3">
              {category.tasks.map((task) => (
                <Card
                  key={task.name}
                  className="bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/60 transition-colors cursor-pointer group rounded-2xl overflow-hidden"
                  onClick={() => task.href && router.push(task.href)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-zinc-800/50 rounded-xl group-hover:bg-primary/10 transition-colors">
                        {task.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white group-hover:text-primary transition-colors">
                          {task.name}
                        </h4>
                        <p className="text-sm text-zinc-500">
                          {task.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Decoration */}
      <div className="mt-16 text-center opacity-20 pointer-events-none">
        <p className="text-xs uppercase tracking-[0.5em] font-light">Desi Content AI</p>
      </div>
    </main>
  );
}
