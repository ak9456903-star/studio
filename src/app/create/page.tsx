
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
  ExternalLink,
  ChevronLeft
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

    // Start new pipeline
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
            
            // If it's the last step, update the document status to 'completed' in Firestore
            if (nextIndex === PIPELINE_STEPS.length - 1) {
              updateDocumentNonBlocking(doc(firestore, 'video_requests', requestId), {
                status: 'completed',
                seo_title: `10 Secrets about ${videoData.topic} that will blow your mind!`,
                seo_description: `In this deep dive, we explore the intricate world of ${videoData.topic} and how it impacts your daily life...`,
                viral_score: Math.floor(Math.random() * 15) + 85,
                tags: ['ai', videoData.topic, 'viral', '2025'],
                hashtags: ['#ai', `#${videoData.topic.replace(/\s+/g, '')}`, '#trending'],
                youtube_url: 'https://youtube.com/watch?v=placeholder'
              });
              clearInterval(interval);
            }
            return nextIndex;
          }
          clearInterval(interval);
          return prev;
        });
      }, 3000); 
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
      <Button variant="ghost" className="mb-6 rounded-full" onClick={() => router.push('/')}>
        <ChevronLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <div className="text-center mb-10">
        <h1 className="text-4xl font-black tracking-tighter text-white">
          {isCompleted ? 'VIDEO COMPLETED' : 'PROCESSING PIPELINE'}
        </h1>
        <p className="text-muted-foreground mt-2 font-medium">Topic: {videoData?.topic || searchParams.get('topic')}</p>
      </div>

      {!isCompleted ? (
        <Card className="bg-card/40 border-primary/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          <div className="mb-8">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-primary uppercase tracking-widest">{PIPELINE_STEPS[activeStepIndex].label}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-primary/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PIPELINE_STEPS.map((step, index) => (
              <div 
                key={step.id} 
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  index < activeStepIndex 
                    ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                    : index === activeStepIndex 
                      ? 'bg-primary/10 border-primary/30 text-primary animate-pulse' 
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-600'
                }`}
              >
                {index < activeStepIndex ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                <span className="text-sm font-bold">{step.label}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
          <Card className="bg-card/40 border-primary/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="aspect-video bg-zinc-950 flex items-center justify-center relative group">
               <Video className="h-16 w-16 text-primary/20 group-hover:scale-110 transition-transform" />
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button className="rounded-full h-16 w-16"><Youtube className="h-8 w-8" /></Button>
               </div>
            </div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                 <div>
                   <h2 className="text-xl font-bold">{videoData?.seo_title || 'The Viral Masterpiece'}</h2>
                   <p className="text-xs text-muted-foreground">Generated at {videoData?.created_at ? new Date(videoData.created_at.toDate()).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                 </div>
                 <div className="bg-primary/20 text-primary px-4 py-2 rounded-full font-black text-sm">
                   SCORE: {videoData?.viral_score || 92}
                 </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 <Button variant="secondary" className="rounded-xl gap-2 text-xs" onClick={() => copyToClipboard(videoData?.seo_description || '', 'SEO Data')}>
                   <Copy className="h-3.5 w-3.5" /> Copy SEO
                 </Button>
                 <Button variant="secondary" className="rounded-xl gap-2 text-xs">
                   <Download className="h-3.5 w-3.5" /> Download
                 </Button>
                 <Button variant="secondary" className="rounded-xl gap-2 text-xs" onClick={() => window.open(videoData?.youtube_url, '_blank')}>
                   <ExternalLink className="h-3.5 w-3.5" /> Open YT
                 </Button>
                 <Button className="rounded-xl gap-2 text-xs" onClick={() => router.push('/')}>
                   <Loader2 className="h-3.5 w-3.5" /> Regenerate
                 </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="bg-card/40 border-primary/10 rounded-3xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" /> SEO Metadata
                </h3>
                <div className="space-y-4 text-sm">
                   <div>
                     <Label className="text-[10px] text-muted-foreground uppercase">Title</Label>
                     <p className="font-medium mt-1">{videoData?.seo_title || `10 Secrets about ${videoData?.topic}!`}</p>
                   </div>
                   <div>
                     <Label className="text-[10px] text-muted-foreground uppercase">Description</Label>
                     <p className="text-zinc-400 mt-1 line-clamp-3">{videoData?.seo_description || 'Loading AI description...'}</p>
                   </div>
                </div>
             </Card>

             <Card className="bg-card/40 border-primary/10 rounded-3xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" /> Thumbnail Preview
                </h3>
                <div className="aspect-video bg-zinc-900 rounded-xl border border-primary/5 flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                   <span className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-primary/40">High CTR Image Preview</span>
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
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <PipelineContent />
    </Suspense>
  );
}
