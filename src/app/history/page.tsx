'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Clapperboard, Calendar, ChevronRight, Video, Trash2 } from 'lucide-react';
import { collection, query, where, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { deleteDocumentNonBlocking } from '@/firebase';

export default function HistoryPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Query for user's video projects
  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'video_requests'),
      where('user_id', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: videos, isLoading } = useCollection(historyQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (firestore) {
        deleteDocumentNonBlocking(doc(firestore, 'video_requests', id));
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 pb-32 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-10 mt-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Project Library</h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Archive of your AI creations</p>
        </div>
        <Clapperboard className="h-10 w-10 text-primary opacity-20" />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-black tracking-widest text-[9px] uppercase animate-pulse">Syncing Cloud Vault...</p>
        </div>
      ) : videos && videos.length > 0 ? (
        <div className="grid gap-4">
          {videos.map((video) => (
            <Card 
              key={video.id} 
              className="bg-card/40 border-2 border-dashed border-primary/10 backdrop-blur-xl rounded-[2rem] overflow-hidden hover:bg-primary/5 transition-all group cursor-pointer shadow-xl"
              onClick={() => router.push(`/create?requestId=${video.id}`)}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-zinc-950 flex items-center justify-center shrink-0 border-2 border-dashed border-primary/5 relative overflow-hidden group-hover:border-primary/20 transition-all">
                   <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                   {video.status === 'completed' ? (
                     <Video className="h-6 w-6 text-primary relative z-10" />
                   ) : (
                     <Loader2 className="h-6 w-6 text-zinc-600 animate-spin relative z-10" />
                   )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-sm truncate group-hover:text-primary transition-colors text-white uppercase tracking-tight">
                    {video.topic}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                      <Calendar className="h-3.5 w-3.5" />
                      {video.created_at ? format(video.created_at.toDate(), 'MMM d, yyyy') : 'Recently'}
                    </div>
                    <Badge variant="outline" className="text-[9px] h-4 px-2 border-primary/20 text-primary/80 uppercase font-black tracking-tighter">
                      {video.style}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge className={video.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/10 rounded-full text-[8px] font-black tracking-widest' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 rounded-full text-[8px] font-black tracking-widest'}>
                    {video.status?.toUpperCase() || 'UNKNOWN'}
                  </Badge>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-zinc-600 hover:text-red-500 hover:bg-red-500/10" onClick={(e) => handleDelete(e, video.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-card/40 border-dashed border-primary/20 border-2 rounded-[2.5rem] p-16 text-center shadow-2xl backdrop-blur-md">
          <Video className="h-16 w-16 text-primary/10 mx-auto mb-6" />
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Empty Library</h3>
          <p className="text-[10px] text-muted-foreground mt-2 mb-8 font-bold uppercase tracking-widest">You haven&apos;t launched any pipelines yet.</p>
          <Button onClick={() => router.push('/')} className="rounded-2xl px-10 py-6 h-auto font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all active:scale-95">
            Create First Video
          </Button>
        </div>
      )}
    </main>
  );
}