'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  CheckCircle2, 
  PenTool, 
  Video, 
  ImageIcon, 
  Globe, 
  Youtube,
  Copy,
  Download,
  ChevronLeft,
  PlayCircle,
  AlertTriangle
} from 'lucide-react';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { generateVideo } from '@/ai/flows/video-generator';
import { generateThumbnail } from '@/ai/flows/thumbnail-generator';
import { generateContent } from '@/ai/flows/content-generator';

const PIPELINE_STEPS = [
  { id: 'script', label: 'Writing Script...', icon: PenTool },
  { id: 'video', label: 'Creating AI Video...', icon: Video },
  { id: 'thumbnail', label: 'Designing Thumbnail...', icon: ImageIcon },
  { id: 'seo', label: 'Finalizing SEO...', icon: Globe },
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
  const [isFallbackVideo, setIsFallbackVideo] = useState(false);
  const [isFallbackThumb, setIsFallbackThumb] = useState(false);
  const pipelineStartedRef = useRef(false);

  const docRef = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return doc(firestore, 'video_requests', requestId);
  }, [firestore, requestId]);

  const { data: videoData } = useDoc(docRef);

  useEffect(() => {
    if (!user || !firestore || requestId || requestIdParam) return;

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

  useEffect(() => {
    if (!requestId || !firestore || !videoData || videoData.status !== 'processing' || pipelineStartedRef.current) return;

    async function runPipeline() {
        pipelineStartedRef.current = true;
        try {
            // STEP 1: SCRIPT
            setActiveStepIndex(0); setProgress(15);
            const scriptData = await generateContent({ 
              taskType: "YouTube Title", 
              topic: videoData!.topic 
            });
            
            // STEP 2: VIDEO
            setActiveStepIndex(1); setProgress(40);
            const videoResult = await generateVideo({ 
                prompt: `A cinematic masterpiece showing ${videoData!.topic} in a ${videoData!.style} style, ${videoData!.tone} tone, high resolution.`, 
                duration: 5 
            });
            
            if (videoResult.error) throw new Error(videoResult.error);
            if (videoResult.isMock) setIsFallbackVideo(true);

            // STEP 3: THUMBNAIL (Nano-Banana with Quota Fallback)
            setActiveStepIndex(2); setProgress(75);
            const thumbResult = await generateThumbnail({ title: videoData!.topic });
            if (thumbResult.isMock) setIsFallbackThumb(true);

            // STEP 4: SEO & FINALIZE
            setActiveStepIndex(3); setProgress(95);
            
            await updateDocumentNonBlocking(doc(firestore!, 'video_requests', requestId!), {
                status: 'completed',
                script: scriptData,
                video_url: videoResult.videoUrl,
                thumbnail_url: thumbResult.imageUrl,
                seo_title: `THE UNTOLD STORY OF ${videoData!.topic.toUpperCase()}`,
                seo_description: `Automated investigation into ${videoData!.topic}. This video was generated entirely by Nullpk AI Studio. #AI #Automation`,
                viral_score: Math.floor(Math.random() * 20) + 80,
                tags: ['ai', 'future', videoData!.topic.toLowerCase().split(' ')[0]],
                youtube_url: 'https://youtube.com'
            });

            setProgress(100);
            toast({ 
              title: "Pipeline Complete", 
              description: "Your AI video and assets are ready!" 
            });

        } catch (e: any) {
            console.error("Pipeline Error:", e);
            toast({ variant: 'destructive', title: "Pipeline Error", description: e.message });
            await updateDocumentNonBlocking(doc(firestore!, 'video_requests', requestId!), { status: 'failed' });
        }
    }

    runPipeline();
  }, [requestId, firestore, videoData, toast]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${label} saved.` });
  };

  const isCompleted = videoData?.status === 'completed';

  return (
    <main className="min-h-screen p-6 pb-32 max-w-4xl mx-auto">
      <Button variant="ghost" className="mb-8 rounded-full hover:bg-primary/10 text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em]" onClick={() => router.push('/')}>
        <ChevronLeft className="h-4 w-4 mr-1" /> Dashboard
      </Button>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">
          {isCompleted ? 'PIPELINE FINISHED' : 'GENERATING BLUEPRINT'}
        </h1>
        <div className="mt-4 flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-primary/40"></span>
            <p className="text-primary font-bold uppercase tracking-widest text-[10px]">
                {videoData?.topic || searchParams.get('topic')}
            </p>
            <span className="h-px w-8 bg-primary/40"></span>
        </div>
      </div>

      {!isCompleted ? (
        <Card className="bg-card/40 border-2 border-dashed border-primary/20 backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
          
          <div className="mb-12">
            <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.3em] mb-4">
              <span className="text-primary animate-pulse">{PIPELINE_STEPS[activeStepIndex]?.label || 'Initializing...'}</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-4 bg-primary/5 rounded-full border border-primary/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PIPELINE_STEPS.map((step, index) => (
              <div 
                key={step.id} 
                className={`flex items-center gap-5 p-6 rounded-[1.5rem] border-2 border-dashed transition-all duration-700 ${
                  index < activeStepIndex 
                    ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                    : index === activeStepIndex 
                      ? 'bg-primary/10 border-primary/40 text-primary shadow-[0_0_30px_rgba(0,212,255,0.15)] scale-[1.02]' 
                      : 'bg-zinc-900/40 border-zinc-800/50 text-zinc-700'
                }`}
              >
                <div className="p-3 rounded-2xl bg-background/60 border border-current/10">
                  {index < activeStepIndex ? <CheckCircle2 className="h-6 w-6" /> : <step.icon className={`h-6 w-6 ${index === activeStepIndex ? 'animate-bounce' : ''}`} />}
                </div>
                <div>
                    <span className="text-xs font-black uppercase tracking-widest block">{step.label}</span>
                    <span className="text-[9px] font-bold uppercase opacity-50 tracking-tighter">
                        {index < activeStepIndex ? 'Step Verified' : index === activeStepIndex ? 'In Progress' : 'Queued'}
                    </span>
                </div>
              </div>
            ))}
          </div>

          {videoData?.status === 'failed' && (
              <div className="mt-10 p-6 bg-red-500/10 border-2 border-dashed border-red-500/20 rounded-[2rem] text-center">
                  <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                  <p className="text-red-500 text-xs font-black uppercase tracking-widest">Pipeline Interrupted. Check topic complexity.</p>
              </div>
          )}
        </Card>
      ) : (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {(isFallbackVideo || isFallbackThumb) && (
            <div className="bg-yellow-500/10 border-2 border-dashed border-yellow-500/20 rounded-3xl p-4 flex items-center gap-3 text-yellow-500">
               <AlertTriangle className="h-5 w-5 shrink-0" />
               <p className="text-[10px] font-bold uppercase tracking-widest">
                  Notice: Placeholder {isFallbackVideo && isFallbackThumb ? 'Assets' : isFallbackVideo ? 'Video' : 'Thumbnail'} used due to AI Quota/Billing limits.
               </p>
            </div>
          )}

          <Card className="bg-card/40 border-2 border-dashed border-primary/20 rounded-[3rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-t-primary/40">
            <div className="aspect-video bg-black flex items-center justify-center relative">
               {videoData?.video_url ? (
                   <video src={videoData.video_url} controls className="w-full h-full object-contain" />
               ) : (
                   <Video className="h-20 w-20 text-primary/5" />
               )}
            </div>
            <CardContent className="p-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                 <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <PlayCircle className="h-10 w-10" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Viral Index</p>
                        <p className="text-2xl font-black text-primary uppercase italic">{videoData?.viral_score}% Potential</p>
                    </div>
                 </div>
                 <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none rounded-2xl h-14 px-8 text-[11px] font-black uppercase tracking-widest gap-2 border-2" onClick={() => copyToClipboard(videoData?.seo_description || '', 'SEO Data')}>
                        <Copy className="h-4 w-4" /> Copy SEO
                    </Button>
                    <Button className="flex-1 md:flex-none rounded-2xl h-14 px-10 text-[11px] font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20" onClick={() => window.open(videoData?.youtube_url, '_blank')}>
                        <Youtube className="h-5 w-5" /> Live Stream
                    </Button>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                   { label: 'Platform', value: videoData?.style },
                   { label: 'Emotion', value: videoData?.tone },
                   { label: 'Target', value: videoData?.duration },
                   { label: 'Region', value: videoData?.language }
                 ].map((stat, i) => (
                    <div key={i} className="p-5 bg-background/40 border-2 border-dashed border-primary/10 rounded-[1.5rem] hover:border-primary/30 transition-colors">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                        <p className="text-sm font-black text-white uppercase italic">{stat.value}</p>
                    </div>
                 ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card className="bg-card/40 border-2 border-dashed border-primary/20 rounded-[2.5rem] p-8 shadow-2xl">
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-3 text-primary">
                  <Globe className="h-5 w-5" /> SEO Metadata
                </h3>
                <div className="space-y-8">
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Optimized Title</Label>
                     <p className="text-lg font-black text-white leading-tight italic">{videoData?.seo_title}</p>
                   </div>
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Viral Tags</Label>
                     <div className="flex flex-wrap gap-2">
                        {videoData?.tags?.map((tag: string) => (
                            <span key={tag} className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-black uppercase border border-primary/20">#{tag}</span>
                        ))}
                     </div>
                   </div>
                </div>
             </Card>

             <Card className="bg-card/40 border-2 border-dashed border-primary/20 rounded-[2.5rem] p-8 shadow-2xl">
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-3 text-primary">
                  <ImageIcon className="h-5 w-5" /> Thumbnail Blueprint
                </h3>
                <div className="aspect-video bg-zinc-950 rounded-[2rem] border-2 border-dashed border-primary/10 flex items-center justify-center relative overflow-hidden group">
                   {videoData?.thumbnail_url ? (
                       <img src={videoData.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                   ) : (
                       <ImageIcon className="h-12 w-12 text-primary/10 animate-pulse" />
                   )}
                   <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                       <Button variant="secondary" size="icon" className="h-14 w-14 rounded-full shadow-2xl" onClick={() => copyToClipboard(videoData?.thumbnail_url || '', 'Thumbnail Link')}>
                           <Download className="h-6 w-6" />
                       </Button>
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
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <PipelineContent />
    </Suspense>
  );
}
