'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  Sparkles, 
  Zap, 
  History as HistoryIcon, 
  Coins, 
  PlayCircle,
  Video,
  Clapperboard,
  Crown,
  User as UserIcon
} from 'lucide-react';
import { collection, query, where, limit } from 'firebase/firestore';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('Shorts');
  const [tone, setTone] = useState('Energetic');
  const [duration, setDuration] = useState('60s');
  const [language, setLanguage] = useState('Hinglish');

  // Fetch only 3 most recent projects for the sidebar
  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'video_requests'),
      where('user_id', '==', user.uid),
      limit(3)
    );
  }, [firestore, user]);

  const { data: recentVideos, isLoading: isHistoryLoading } = useCollection(historyQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleCreateVideo = () => {
    if (!topic.trim()) return;
    const params = new URLSearchParams({
      topic, style, tone, duration, language
    });
    router.push(`/create?${params.toString()}`);
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 mt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-2 uppercase">
            NULLPK <span className="text-primary">STUDIO</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Automatic Video Factory • AI Powered</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">250 Credits</span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full bg-card border" onClick={() => router.push('/profile')}>
            <UserIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form - Using Dashed Borders */}
        <Card className="lg:col-span-2 bg-card/40 border-2 border-dashed border-primary/20 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              New Video Pipeline
            </CardTitle>
            <CardDescription>Enter a topic and watch AI create a masterpiece from scratch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Video Topic</Label>
              <Input 
                placeholder="e.g., Hidden secrets of the Taj Mahal" 
                className="rounded-2xl h-12 bg-background/50 border-primary/5 focus:ring-primary/20"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="rounded-2xl bg-background/50 border-primary/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shorts">YouTube Shorts</SelectItem>
                    <SelectItem value="Documentary">Documentary</SelectItem>
                    <SelectItem value="Educational">Educational</SelectItem>
                    <SelectItem value="Podcast">AI Podcast</SelectItem>
                    <SelectItem value="Motivational">Motivational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="rounded-2xl bg-background/50 border-primary/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Energetic">Energetic</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Suspenseful">Suspenseful</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="rounded-2xl bg-background/50 border-primary/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30s">30 Seconds</SelectItem>
                    <SelectItem value="60s">60 Seconds</SelectItem>
                    <SelectItem value="3m">3 Minutes</SelectItem>
                    <SelectItem value="5m">5 Minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="rounded-2xl bg-background/50 border-primary/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hinglish">Hinglish</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi (Pure)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
              onClick={handleCreateVideo}
              disabled={!topic.trim()}
            >
              <Zap className="h-5 w-5 mr-2 fill-current" />
              Launch Pipeline
            </Button>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-card/40 border-2 border-dashed border-primary/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
                <HistoryIcon className="h-4 w-4 text-primary" />
                Recent History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isHistoryLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
              ) : recentVideos && recentVideos.length > 0 ? (
                recentVideos.map((video) => (
                  <div 
                    key={video.id} 
                    className="p-3 bg-background/40 border-2 border-dashed border-primary/5 rounded-2xl hover:bg-primary/5 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/create?requestId=${video.id}`)}
                  >
                    <h4 className="text-[11px] font-bold truncate text-white uppercase tracking-tight">{video.topic}</h4>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">{video.style}</span>
                      <span className={`text-[9px] font-black uppercase ${video.status === 'completed' ? 'text-green-500' : 'text-primary'}`}>
                        {video.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-muted-foreground text-center py-4">No projects yet.</p>
              )}
              <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-primary hover:bg-transparent" onClick={() => router.push('/history')}>
                Library View
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-dashed border-primary/30 rounded-[2rem] overflow-hidden shadow-lg">
            <CardContent className="p-5 text-center">
              <Crown className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-black text-white uppercase text-sm tracking-tighter">Upgrade to Pro</h3>
              <p className="text-[10px] text-zinc-300 mt-1 leading-relaxed">Unlimited 4K Videos, No Watermark, Faster Server Processing.</p>
              <Button className="w-full mt-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-[10px]">Go Pro</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}