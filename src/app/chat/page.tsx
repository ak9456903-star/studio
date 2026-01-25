'use client';

import { useState, useRef, useEffect, ElementRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type ChatMessage, type AnalysisOutput } from '@/ai/flows/chat-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, User, Sparkles, Copy, ThumbsUp, ThumbsDown, RefreshCw, Paperclip, X } from 'lucide-react';
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
        return; // Don't send empty message
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
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          topic: 'Content Viral Potential Analysis',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      const analysisResult: AnalysisOutput = await response.json();


      const historyRecord = {
          userId: user.uid,
          mode: 'analyze',
          content: userMessage.content,
          result: analysisResult,
          createdAt: serverTimestamp(),
      };
      const historyColRef = collection(firestore, 'history');
      addDocumentNonBlocking(historyColRef, historyRecord);

      const aiResponseMarkdown = formatAnalysisToMarkdown(analysisResult);
      
      setMessages((prev) => [...prev, { role: 'model', content: aiResponseMarkdown }]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sorry, something went wrong. Please try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: errorMessage },
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
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="mx-auto max-w-3xl w-full space-y-8 p-4 pb-24">
          {messages.length === 0 && !isLoading && (
            <div className="flex h-[calc(100vh_-_15rem)] items-center justify-center">
              <div className='text-center'>
                <div className='inline-block p-4 bg-primary/10 rounded-full'>
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-4xl font-bold mt-4">Content Strategy</h1>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Upload your Instagram Reels or YouTube Shorts to get feedback on its viral potential!
                </p>
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-4',
              )}
            >
              {message.role === 'model' ? (
                <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </Avatar>
              ) : (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
              )}
             
              <div className="flex-1">
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
                      'max-w-full rounded-lg p-3 text-sm prose dark:prose-invert',
                      {'bg-muted': message.role === 'user'},
                      {'bg-card': message.role === 'model'},
                      {'mt-2': message.media}
                    )}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                    </ReactMarkdown>
                </div>
                {message.role === 'model' && (
                  <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                    <Button variant="ghost" size="icon" className='h-7 w-7' onClick={() => handleCopy(message.content)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className='h-7 w-7'>
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                     <Button variant="ghost" size="icon" className='h-7 w-7'>
                      <ThumbsDown className="h-4 w-4" />
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
            <div className="flex items-start gap-4">
              <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </Avatar>
              <div className="bg-card rounded-lg p-3 flex items-center shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur-sm border-t">
        <div className="container mx-auto max-w-3xl py-3 px-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {mediaPreview && (
                <div className="relative mb-2 w-fit">
                  {mediaType?.startsWith('image/') ? (
                    <NextImage src={mediaPreview} alt="Preview" width={100} height={100} className="rounded-md object-cover" />
                  ) : (
                    <video src={mediaPreview} width="200" controls className="rounded-md" />
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
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
                          className="absolute left-1 flex h-9 w-9 items-center justify-center rounded-full"
                          onClick={() => mediaInputRef.current?.click()}
                          disabled={isLoading}
                        >
                          <Paperclip className="h-5 w-5 text-muted-foreground" />
                          <span className="sr-only">Attach media</span>
                        </Button>
                        <Input
                          type="file"
                          accept="image/*,video/*"
                          ref={mediaInputRef}
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Input
                          placeholder="Add a comment or just send the media..."
                          autoComplete="off"
                          className="h-12 w-full rounded-full bg-muted pl-12 pr-14 text-base"
                          {...field}
                        />
                        <Button
                          type="submit"
                          size="icon"
                          className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                          disabled={isLoading || (!form.getValues().message && !mediaPreview)}
                        >
                          <Send className="h-5 w-5" />
                          <span className="sr-only">Send message</span>
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
