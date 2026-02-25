'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Clapperboard, Calendar, ChevronRight, Video } from 'lucide-react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function HistoryPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Fetch all video requests for the current user
  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'video_requests'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );
  }, [firestore, user]);

  const { data: videos, isLoading } = useCollection(historyQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 pb-32 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Project History</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage and review your AI masterpieces</p>
        </div>
        <Clapperboard className="h-10 w-10 text-primary opacity-20" />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-bold tracking-widest text-[10px] uppercase animate-pulse">Syncing Library...</p>
        </div>
      ) : videos && videos.length > 0 ? (
        <div className="grid gap-4">
          {videos.map((video) => (
            <Card 
              key={video.id} 
              className="bg-card/40 border-primary/10 backdrop-blur-xl rounded-2xl overflow-hidden hover:bg-primary/5 transition-all group cursor-pointer border shadow-xl"
              onClick={() => router.push(`/create?requestId=${video.id}`)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-zinc-950 flex items-center justify-center shrink-0 border border-primary/5 relative overflow-hidden">
                   <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                   {video.status === 'completed' ? (
                     <Video className="h-6 w-6 text-primary relative z-10" />
                   ) : (
                     <Loader2 className="h-6 w-6 text-zinc-600 animate-spin relative z-10" />
                   )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors text-white">
                    {video.topic}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                      <Calendar className="h-3.5 w-3.5" />
                      {video.created_at ? format(video.created_at.toDate(), 'MMM d, yyyy') : 'Recent'}
                    </div>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-primary/20 text-primary/80 uppercase font-black tracking-tighter">
                      {video.style}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge className={video.status === 'completed' ? 'bg-green-500/20 text-green-500 hover:bg-green-500/20 rounded-full text-[9px] font-bold' : 'bg-primary/20 text-primary hover:bg-primary/20 rounded-full text-[9px] font-bold'}>
                    {video.status.toUpperCase()}
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-card/40 border-dashed border-primary/20 border-2 rounded-3xl p-16 text-center shadow-2xl backdrop-blur-md">
          <Clapperboard className="h-16 w-16 text-primary/10 mx-auto mb-6" />
          <h3 className="text-xl font-black text-zinc-200 uppercase tracking-tighter">No Projects Found</h3>
          <p className="text-sm text-muted-foreground mt-2 mb-8 font-medium">Your creative journey hasn&apos;t started yet. Launch your first pipeline!</p>
          <Button onClick={() => router.push('/')} className="rounded-2xl px-10 py-6 h-auto font-black uppercase tracking-widest shadow-lg shadow-primary/20">
            Create New Video
          </Button>
        </div>
      )}
    </main>
  );
}