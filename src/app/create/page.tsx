'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  CheckCircle2, 
  Search, 
  PenTool, 
  Mic, 
  Video, 
  ImageIcon, 
  Globe, 
  Youtube,
  Copy,
  Download,
  ChevronLeft,
  PlayCircle
} from 'lucide-react';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const PIPELINE_STEPS = [
  { id: 'research', label: 'Researching Topic...', icon: Search },
  { id: 'script', label: 'Writing Script...', icon: PenTool },
  { id: 'voice', label: 'Generating Voiceover...', icon: Mic },
  { id: 'video', label: 'Creating AI Visuals...', icon: Video },
  { id: 'thumbnail', label: 'Designing Thumbnail...', icon: ImageIcon },
  { id: 'seo', label: 'Optimizing SEO...', icon: Globe },
  { id: 'upload', label: 'Uploading to YouTube...', icon: Youtube },
];

function PipelineContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const requestIdParam = searchParams.get('requestId');
  const [requestId, setRequestId] = useState<string | null>(requestIdParam);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Memoize the document reference
  const docRef = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return doc(firestore, 'video_requests', requestId);
  }, [firestore, requestId]);

  const { data: videoData } = useDoc(docRef);

  useEffect(() => {
    if (!user || !firestore || requestId || requestIdParam) return;

    // Start new pipeline if no requestId is provided
    const topic = searchParams.get('topic');
    const style = searchParams.get('style');
    const tone = searchParams.get('tone');
    const duration = searchParams.get('duration');
    const language = searchParams.get('language');

    if (!topic) {
      router.push('/');
      return;
    }

    const newDoc = {
      user_id: user.uid,
      topic,
      style,
      tone,
      duration,
      language,
      status: 'processing',
      created_at: serverTimestamp(),
      viral_score: 0,
    };

    addDocumentNonBlocking(collection(firestore, 'video_requests'), newDoc)
      .then((ref) => {
        if (ref) setRequestId(ref.id);
      });
  }, [user, firestore, requestId, searchParams, router, requestIdParam]);

  // Simulate progress steps and persist 'completed' status
  useEffect(() => {
    if (requestId && firestore && videoData && videoData.status === 'processing') {
      const interval = setInterval(() => {
        setActiveStepIndex((prev) => {
          if (prev < PIPELINE_STEPS.length - 1) {
            const nextIndex = prev + 1;
            const newProgress = ((nextIndex + 1) / PIPELINE_STEPS.length) * 100;
            setProgress(newProgress);
            
            // On the last step, finalize the document in Firestore
            if (nextIndex === PIPELINE_STEPS.length - 1) {
              updateDocumentNonBlocking(doc(firestore, 'video_requests', requestId), {
                status: 'completed',
                seo_title: `THE TRUTH ABOUT ${videoData.topic.toUpperCase()} (Viral Secrets)`,
                seo_description: `Discover the untold facts about ${videoData.topic}. We dive deep into the research, analysis, and future implications of this topic in 2025.`,
                viral_score: Math.floor(Math.random() * 15) + 85,
                tags: ['ai', videoData.topic.toLowerCase(), 'viral', '2025', 'educational'],
                hashtags: ['#ai', `#${videoData.topic.replace(/\s+/g, '')}`, '#trending', '#educational'],
                youtube_url: 'https://youtube.com/watch?v=placeholder'
              });
              clearInterval(interval);
            }
            return nextIndex;
          }
          clearInterval(interval);
          return prev;
        });
      }, 3500); // 3.5s per step for a realistic feel
      return () => clearInterval(interval);
    } else if (videoData?.status === 'completed') {
        setActiveStepIndex(PIPELINE_STEPS.length - 1);
        setProgress(100);
    }
  }, [requestId, videoData, firestore]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${label} saved to clipboard.` });
  };

  const isCompleted = videoData?.status === 'completed' || activeStepIndex === PIPELINE_STEPS.length - 1;

  return (
    <main className="min-h-screen p-6 pb-24 max-w-4xl mx-auto">
      <Button variant="ghost" className="mb-6 rounded-full hover:bg-primary/5 text-muted-foreground" onClick={() => router.push('/')}>
        <ChevronLeft className="h-4 w-4 mr-1" /> Dashboard
      </Button>

      <div className="text-center mb-10">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
          {isCompleted ? 'MASTERPIECE READY' : 'NULLPK PIPELINE ACTIVE'}
        </h1>
        <p className="text-muted-foreground mt-2 font-bold uppercase tracking-widest text-xs">
            {videoData?.topic || searchParams.get('topic')}
        </p>
      </div>

      {!isCompleted ? (
        <Card className="bg-card/40 border-2 border-dashed border-primary/20 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 animate-pulse" />
          
          <div className="mb-8">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] mb-3">
              <span className="text-primary">{PIPELINE_STEPS[activeStepIndex].label}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-3 bg-primary/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PIPELINE_STEPS.map((step, index) => (
              <div 
                key={step.id} 
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed transition-all duration-500 ${
                  index < activeStepIndex 
                    ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                    : index === activeStepIndex 
                      ? 'bg-primary/10 border-primary/40 text-primary shadow-[0_0_20px_rgba(0,212,255,0.1)]' 
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-600'
                }`}
              >
                <div className="p-2 rounded-xl bg-background/50 border border-current/10">
                  {index < activeStepIndex ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                </div>
                <span className="text-xs font-black uppercase tracking-widest">{step.label}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="space-y-8 animate-in fade-in zoom-in duration-700">
          <Card className="bg-card/40 border-2 border-dashed border-primary/20 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="aspect-video bg-zinc-950 flex items-center justify-center relative group cursor-pointer">
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
               <Video className="h-16 w-16 text-primary/20 group-hover:scale-110 transition-transform relative z-20" />
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
               <div className="absolute bottom-6 left-6 z-20">
                 <h2 className="text-xl font-black text-white uppercase tracking-tighter line-clamp-1">{videoData?.seo_title}</h2>
               </div>
            </div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <PlayCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Viral Score</p>
                        <p className="text-sm font-black text-primary uppercase">{videoData?.viral_score}/100 Potential</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <Button variant="secondary" className="rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-widest gap-2" onClick={() => copyToClipboard(videoData?.seo_description || '', 'SEO Data')}>
                        <Copy className="h-4 w-4" /> Copy SEO
                    </Button>
                    <Button className="rounded-xl h-10 px-6 text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20" onClick={() => window.open(videoData?.youtube_url, '_blank')}>
                        <Youtube className="h-4 w-4" /> YouTube
                    </Button>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="p-4 bg-background/40 border-2 border-dashed border-primary/5 rounded-2xl">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Style</p>
                    <p className="text-sm font-bold text-white uppercase">{videoData?.style}</p>
                 </div>
                 <div className="p-4 bg-background/40 border-2 border-dashed border-primary/5 rounded-2xl">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Tone</p>
                    <p className="text-sm font-bold text-white uppercase">{videoData?.tone}</p>
                 </div>
                 <div className="p-4 bg-background/40 border-2 border-dashed border-primary/5 rounded-2xl">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Duration</p>
                    <p className="text-sm font-bold text-white uppercase">{videoData?.duration}</p>
                 </div>
                 <div className="p-4 bg-background/40 border-2 border-dashed border-primary/5 rounded-2xl">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Language</p>
                    <p className="text-sm font-bold text-white uppercase">{videoData?.language}</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="bg-card/40 border-2 border-dashed border-primary/20 rounded-[2.5rem] p-6 shadow-xl">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2 text-primary">
                  <Globe className="h-4 w-4" /> SEO Optimization
                </h3>
                <div className="space-y-6">
                   <div className="space-y-2">
                     <Label className="text-[9px] font-black text-muted-foreground uppercase">Viral Title</Label>
                     <p className="text-sm font-bold text-white leading-tight">{videoData?.seo_title}</p>
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[9px] font-black text-muted-foreground uppercase">Smart Tags</Label>
                     <div className="flex flex-wrap gap-1.5">
                        {videoData?.tags?.map((tag: string) => (
                            <span key={tag} className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase border border-primary/20">#{tag}</span>
                        ))}
                     </div>
                   </div>
                </div>
             </Card>

             <Card className="bg-card/40 border-2 border-dashed border-primary/20 rounded-[2.5rem] p-6 shadow-xl">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2 text-primary">
                  <ImageIcon className="h-4 w-4" /> Thumbnail Review
                </h3>
                <div className="aspect-video bg-zinc-900 rounded-2xl border-2 border-dashed border-primary/5 flex items-center justify-center relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                   <ImageIcon className="h-10 w-10 text-primary/10 group-hover:scale-110 transition-transform" />
                   <div className="absolute top-3 right-3">
                       <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10" onClick={() => copyToClipboard(videoData?.topic || '', 'Thumbnail Prompt')}>
                           <Download className="h-4 w-4 text-white" />
                       </Button>
                   </div>
                   <div className="absolute bottom-3 left-3">
                       <span className="text-[8px] font-black uppercase tracking-widest text-primary/40 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">High CTR 4K Preview</span>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CreatePipelinePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <PipelineContent />
    </Suspense>
  );
}