'use client';

import { useState, useRef, useEffect, ElementRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type ChatMessage, type AnalysisOutput } from '@/ai/flows/chat-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, User, Sparkles, Copy, ThumbsUp, ThumbsDown, RefreshCw, Paperclip, X, Zap } from 'lucide-react';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import NextImage from 'next/image';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  message: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

function formatAnalysisToMarkdown(analysis: AnalysisOutput): string {
    const problems = analysis.problems.length > 0
        ? analysis.problems.map(p => `- ${p}`).join('\n')
        : 'No major problems found. Great job!';

    const improvements = analysis.improvements.length > 0
        ? analysis.improvements.map(i => `- ${i}`).join('\n')
        : 'Keep up the good work!';

    return `
### Viral Analysis
**Viral Score:** ${analysis.viral_score}/100
**Status:** ${analysis.status}

---

#### 🚨 Problems / Weaknesses
${problems}

---

#### 💡 Improvement Suggestions
${improvements}

---

#### ✨ Optimized Version
**Title:** ${analysis.optimized_content.title}
**Caption:** ${analysis.optimized_content.caption}
**Hashtags:** ${analysis.optimized_content.hashtags.join(' ')}
**CTA:** ${analysis.optimized_content.cta}

**Script:**
> ${analysis.optimized_content.script.replace(/\n/g, '\n> ')}

---
*Keep going, you are improving 🚀*
    `.trim();
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'analyze' ? false : true; // default to fast chat
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFastMode, setIsFastMode] = useState(initialMode);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const scrollAreaRef = useRef<ElementRef<typeof ScrollArea>>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            setMediaPreview(e.target?.result as string);
            setMediaType(file.type);
        };
        reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!user || !firestore) return;

    let userMessage: ChatMessage = { role: 'user', content: data.message };
    
    if (mediaPreview && mediaType) {
        userMessage.media = { url: mediaPreview, type: mediaType };
    }

    if (!userMessage.content && !userMessage.media) {
        return;
    }

    const newMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(newMessages);
    form.reset();
    setMediaPreview(null);
    setMediaType(null);
    if (mediaInputRef.current) {
      mediaInputRef.current.value = '';
    }
    setIsLoading(true);

    try {
      const customApiUrl = localStorage.getItem('customApiUrl');
      const apiPath = isFastMode ? '/api/chat' : '/api/analyze';
      
      const response = await fetch(customApiUrl || apiPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customApiUrl ? {
            userId: user.uid,
            mode: isFastMode ? 'chat' : 'analyze',
            content: userMessage.content,
          } : {
            messages: newMessages,
            topic: isFastMode ? 'General Chat' : 'Viral Content Analysis',
          })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
          throw new Error('The API returned an unexpected response format.');
      }

      const result = await response.json();

      if (!response.ok) {
          throw new Error(result.error || 'API request failed');
      }

      let aiResponseContent = '';
      
      if (isFastMode) {
          aiResponseContent = result.answer || result.data?.answer || 'I am here to help!';
      } else {
          const analysisResult = customApiUrl ? result.data : result;
          aiResponseContent = formatAnalysisToMarkdown(analysisResult);
          
          // Save analysis to history
          const historyRecord = {
              userId: user.uid,
              mode: 'analyze',
              content: userMessage.content,
              result: analysisResult,
              createdAt: serverTimestamp(),
          };
          addDocumentNonBlocking(collection(firestore, 'history'), historyRecord);
      }
      
      setMessages((prev) => [...prev, { role: 'model', content: aiResponseContent }]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: `**Error:** ${errorMessage}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages, isLoading]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-2">
          {isFastMode ? <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" /> : <Sparkles className="h-5 w-5 text-primary" />}
          <h1 className="font-bold">{isFastMode ? 'Fast Chat' : 'Viral Analyzer'}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="mode-toggle" className="text-xs text-muted-foreground">
            {isFastMode ? 'Switch to Analysis' : 'Switch to Fast Chat'}
          </Label>
          <Switch 
            id="mode-toggle" 
            checked={!isFastMode} 
            onCheckedChange={(checked) => setIsFastMode(!checked)} 
          />
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="mx-auto max-w-3xl w-full space-y-8 p-4 pb-32">
          {messages.length === 0 && !isLoading && (
            <div className="flex h-[calc(100vh_-_20rem)] items-center justify-center">
              <div className='text-center'>
                <div className='inline-block p-4 bg-primary/10 rounded-full mb-4'>
                  {isFastMode ? <Zap className="h-10 w-10 text-yellow-500" /> : <Sparkles className="h-10 w-10 text-primary" />}
                </div>
                <h2 className="text-3xl font-bold">
                  {isFastMode ? 'Fast Chat & Answers' : 'Deep Content Analysis'}
                </h2>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                  {isFastMode 
                    ? 'Ask me anything for instant help with your content ideas!' 
                    : 'Upload your Reels or Shorts to see if they will go viral!'}
                </p>
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3',
              )}
            >
              {message.role === 'model' ? (
                <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  {isFastMode ? <Zap className="h-4 w-4 fill-white" /> : <Sparkles className="h-4 w-4" />}
                </Avatar>
              ) : (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-muted">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
             
              <div className="flex-1 min-w-0">
                {message.media && (
                    <div className="mb-2">
                        {message.media.type.startsWith('image/') ? (
                            <NextImage src={message.media.url} alt="Uploaded content" width={300} height={300} className="rounded-lg object-cover" />
                        ) : (
                            <video src={message.media.url} controls className="max-w-xs rounded-lg" />
                        )}
                    </div>
                )}
                 <div
                    className={cn(
                      'max-w-full rounded-2xl p-4 text-sm prose dark:prose-invert shadow-sm',
                      {'bg-muted/50 rounded-tl-none': message.role === 'user'},
                      {'bg-card border rounded-tl-none': message.role === 'model'},
                    )}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                    </ReactMarkdown>
                </div>
                {message.role === 'model' && !message.content.startsWith('**Error:**') && (
                  <div className="flex items-center gap-1 mt-2 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className='h-7 w-7' onClick={() => handleCopy(message.content)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className='h-7 w-7'>
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                     <Button variant="ghost" size="icon" className='h-7 w-7'>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center animate-pulse">
                {isFastMode ? <Zap className="h-4 w-4 fill-white" /> : <Sparkles className="h-4 w-4" />}
              </Avatar>
              <div className="bg-card border rounded-2xl p-4 flex items-center shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-xs text-muted-foreground">{isFastMode ? 'Thinking fast...' : 'Analyzing viral potential...'}</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-3">
        <div className="container mx-auto max-w-3xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {mediaPreview && (
                <div className="relative mb-3 p-1 bg-muted rounded-xl w-fit">
                  {mediaType?.startsWith('image/') ? (
                    <NextImage src={mediaPreview} alt="Preview" width={80} height={80} className="rounded-lg object-cover" />
                  ) : (
                    <video src={mediaPreview} width="120" className="rounded-lg" />
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
                    onClick={() => { setMediaPreview(null); setMediaType(null); if(mediaInputRef.current) mediaInputRef.current.value = ''; }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative flex w-full items-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
                          onClick={() => mediaInputRef.current?.click()}
                          disabled={isLoading}
                        >
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Input
                          type="file"
                          accept="image/*,video/*"
                          ref={mediaInputRef}
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Input
                          placeholder={isFastMode ? "Type a quick message..." : "Paste script or upload content for analysis..."}
                          autoComplete="off"
                          className="h-12 w-full rounded-full bg-muted/50 border-none pl-12 pr-14 text-sm focus-visible:ring-1 focus-visible:ring-primary shadow-inner"
                          {...field}
                        />
                        <Button
                          type="submit"
                          size="icon"
                          className={cn(
                            "absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-full transition-all",
                            isFastMode ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"
                          )}
                          disabled={isLoading || (!form.getValues().message && !mediaPreview)}
                        >
                          {isFastMode ? <Zap className="h-4 w-4 fill-white" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
