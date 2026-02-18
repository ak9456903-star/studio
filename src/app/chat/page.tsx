'use client';

import { useState, useRef, useEffect, ElementRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type ChatMessage, type AnalysisOutput } from '@/ai/flows/chat-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, User, Sparkles, Copy, ThumbsUp, Paperclip, X, Zap, Bot } from 'lucide-react';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  message: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

function formatAnalysisToMarkdown(analysis: AnalysisOutput): string {
    if (!analysis.is_analysis) return analysis.chat_response || '';

    const problems = (analysis.problems || []).length > 0
        ? analysis.problems!.map(p => `- ${p}`).join('\n')
        : 'No major problems found. Great job!';

    const improvements = (analysis.improvements || []).length > 0
        ? analysis.improvements!.map(i => `- ${i}`).join('\n')
        : 'Keep up the good work!';

    const opt = analysis.optimized_content;

    return `
### 📊 Viral Potential Analysis
**Viral Score:** ${analysis.viral_score || 'N/A'}/100
**Status:** ${analysis.status || 'Ready'}

---

#### 🚨 Problems / Weaknesses
${problems}

---

#### 💡 Improvement Suggestions
${improvements}

---

${opt ? `
#### ✨ Optimized Version
**Title:** ${opt.title || 'N/A'}
**Caption:** ${opt.caption || 'N/A'}
**Hashtags:** ${(opt.hashtags || []).join(' ')}
**CTA:** ${opt.cta || 'N/A'}

${opt.script ? `**Script:**\n> ${opt.script.replace(/\n/g, '\n> ')}` : ''}
` : ''}

---
*Keep creating, you're doing great! 🚀*
    `.trim();
}

export default function SmartChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const scrollAreaRef = useRef<ElementRef<typeof ScrollArea>>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: '' },
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
    if (mediaPreview && mediaType) userMessage.media = { url: mediaPreview, type: mediaType };
    if (!userMessage.content && !userMessage.media) return;

    const newMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(newMessages);
    form.reset();
    setMediaPreview(null);
    setMediaType(null);
    if (mediaInputRef.current) mediaInputRef.current.value = '';
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) throw new Error('Request failed');
      const result = await response.json();
      const analysis: AnalysisOutput = result.answer; 

      const aiResponseContent = formatAnalysisToMarkdown(analysis);
      
      if (analysis.is_analysis) {
          addDocumentNonBlocking(collection(firestore, 'history'), {
              userId: user.uid,
              mode: 'smart_analysis',
              content: userMessage.content,
              result: analysis,
              createdAt: serverTimestamp(),
          });
      }
      
      setMessages((prev) => [...prev, { role: 'model', content: aiResponseContent }]);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'AI is currently busy. Try again later.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Text copied to clipboard.' });
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
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
      <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-bold">Smart AI Assistant</h1>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Auto-Detect Mode
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="mx-auto max-w-3xl w-full space-y-8 p-4 pb-32">
          {messages.length === 0 && !isLoading && (
            <div className="flex h-[calc(100vh_-_20rem)] items-center justify-center">
              <div className='text-center space-y-6'>
                <div className='inline-flex items-center gap-4'>
                    <div className='p-4 bg-yellow-500/10 rounded-2xl'>
                        <Zap className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div className='p-4 bg-primary/10 rounded-2xl'>
                        <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-bold">How can I help you today?</h2>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                      Paste a script for analysis, ask a quick question, or upload an image. I'll automatically detect what you need!
                    </p>
                </div>
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className="flex items-start gap-3">
              <Avatar className={cn("h-8 w-8 shrink-0", message.role === 'model' ? "bg-primary" : "bg-muted")}>
                {message.role === 'model' ? (
                  <Bot className="h-4 w-4 text-white" />
                ) : (
                  <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                )}
              </Avatar>
             
              <div className="flex-1 min-w-0">
                {message.media && (
                    <div className="mb-2">
                        {message.media.type.startsWith('image/') ? (
                            <NextImage src={message.media.url} alt="Upload" width={300} height={300} className="rounded-lg object-cover" />
                        ) : (
                            <video src={message.media.url} controls className="max-w-xs rounded-lg" />
                        )}
                    </div>
                )}
                 <div className={cn(
                      'max-w-full rounded-2xl p-4 text-sm prose dark:prose-invert shadow-sm',
                      message.role === 'user' ? 'bg-muted/50 rounded-tl-none' : 'bg-card border rounded-tl-none'
                 )}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
                {message.role === 'model' && (
                  <div className="flex items-center gap-1 mt-2 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className='h-7 w-7' onClick={() => handleCopy(message.content)}><Copy className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className='h-7 w-7'><ThumbsUp className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 bg-primary animate-pulse">
                <Bot className="h-4 w-4 text-white" />
              </Avatar>
              <div className="bg-card border rounded-2xl p-4 flex items-center shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="ml-2 text-xs text-muted-foreground">Detecting intent and thinking...</span>
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
                  <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg" onClick={() => { setMediaPreview(null); setMediaType(null); if(mediaInputRef.current) mediaInputRef.current.value = ''; }}><X className="h-3 w-3" /></Button>
                </div>
              )}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative flex w-full items-center">
                        <Button type="button" variant="ghost" size="icon" className="absolute left-2 h-8 w-8 rounded-full" onClick={() => mediaInputRef.current?.click()} disabled={isLoading}><Paperclip className="h-4 w-4 text-muted-foreground" /></Button>
                        <input type="file" accept="image/*,video/*" ref={mediaInputRef} className="hidden" onChange={handleFileChange} />
                        <Input placeholder="Type anything... I'll detect what you need!" autoComplete="off" className="h-12 w-full rounded-full bg-muted/50 border-none pl-12 pr-14 text-sm focus-visible:ring-1 focus-visible:ring-primary" {...field} />
                        <Button type="submit" size="icon" className="absolute right-1.5 h-9 w-9 rounded-full bg-primary" disabled={isLoading || (!form.getValues().message && !mediaPreview)}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
