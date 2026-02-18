'use client';

import { useState, useRef, useEffect, ElementRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type ChatMessage, type AnalysisOutput } from '@/ai/flows/chat-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Sparkles, Copy, Paperclip, X, Zap, Bot, Check, Image as ImageIcon, Video, BarChart3, Plus } from 'lucide-react';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE_MB = 500;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const formSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

type FormValues = z.infer<typeof formSchema>;

function formatAnalysisToMarkdown(analysis: AnalysisOutput): string {
    if (!analysis.is_analysis) return analysis.chat_response || '';

    const problems = (analysis.problems || []).length > 0
        ? analysis.problems!.map(p => `- ${p}`).join('\n')
        : 'No major weaknesses found! Your hook looks solid. ✅';

    const improvements = (analysis.improvements || []).length > 0
        ? analysis.improvements!.map(i => `- ${i}`).join('\n')
        : 'You\'re on the right track! Just keep the consistency going.';

    const opt = analysis.optimized_content;

    let markdown = analysis.chat_response ? `${analysis.chat_response}\n\n` : '';
    
    markdown += `### 📊 Viral Analysis Summary\n---\n- **Viral Score:** \`${analysis.viral_score || 'N/A'}/100\`\n- **Status:** **${analysis.status || 'Ready to Post'}**\n\n#### 🚨 Critical Feedback\n${problems}\n\n#### 💡 Suggested Tweaks\n${improvements}\n`;

    if (opt) {
        markdown += `\n#### ✨ Optimized Version (Guaranteed Viral)\n> **Title:** ${opt.title || 'N/A'}\n> **Caption:** ${opt.caption || 'N/A'}\n> **Hashtags:** ${(opt.hashtags || []).join(' ')}\n> **CTA:** ${opt.cta || 'N/A'}\n`;
        
        if (opt.script) {
            markdown += `\n**Viral Script Rewrite:**\n\`\`\`text\n${opt.script}\n\`\`\`\n`;
        }
    }

    markdown += `\n---\n*Keep creating! You're one post away from going viral. 🚀*`;

    return markdown.trim();
}

export default function SmartChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
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
        if (file.size > MAX_FILE_SIZE_BYTES) {
            toast({ 
              variant: 'destructive', 
              title: 'File too large', 
              description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.` 
            });
            if (mediaInputRef.current) mediaInputRef.current.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            setMediaPreview(e.target?.result as string);
            setMediaType(file.type);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setMediaPreview(null);
    setMediaType(null);
    form.reset();
    if (mediaInputRef.current) mediaInputRef.current.value = '';
    toast({
        title: "Chat Reset",
        description: "Started a fresh conversation.",
    });
  };

  const onSubmit = async (data: FormValues) => {
    if (!user || !firestore) return;

    const userMessage: ChatMessage = { role: 'user', content: data.message };
    if (mediaPreview && mediaType) userMessage.media = { url: mediaPreview, type: mediaType };
    
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error('API Error: Could not get response from AI.');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response received:', text);
          throw new Error('The AI returned an unexpected response format. Please try again.');
      }

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
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Oops!', 
        description: error.message || 'I had a small hiccup. Can you try again?' 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Copied!', description: 'Response saved to clipboard.' });
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, isLoading]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const suggestions = [
    { text: 'Create a landscape image', icon: <ImageIcon className="h-3.5 w-3.5 text-yellow-500" /> },
    { text: 'AI API call video generator', icon: <Video className="h-3.5 w-3.5 text-blue-500" /> },
    { text: 'Analyze videos and images', icon: <BarChart3 className="h-3.5 w-3.5 text-purple-500" /> },
    { text: 'Viral hook for reels?', icon: <Sparkles className="h-3.5 w-3.5 text-pink-500" /> },
    { text: 'Trending hashtags?', icon: <Bot className="h-3.5 w-3.5 text-green-500" /> },
    { text: 'Viral Video Optimizer (titles/captions)', icon: <Zap className="h-3.5 w-3.5 text-orange-500" /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-card/40 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/15 rounded-xl">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none">Smart Assistant</h1>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                AI Model Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleNewChat}
                className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
            >
                <Plus className="h-3.5 w-3.5" />
                New Chat
            </Button>
            <div className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:block">
                Auto-Detect
            </div>
        </div>
      </header>

      {/* Chat Area */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="mx-auto max-w-3xl w-full flex flex-col gap-6 p-6 pb-40">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col h-[60vh] items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                    <div className="relative p-6 bg-card border rounded-3xl shadow-xl">
                        <Sparkles className="h-10 w-10 text-primary" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?</h2>
                <p className="text-muted-foreground mt-3 max-w-xs leading-relaxed">
                  Upload a video (even 20-30 min long) or share a script. I'll optimize it for maximum virality!
                </p>
                <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-lg">
                    {suggestions.map((s) => (
                        <button 
                            key={s.text}
                            onClick={() => form.setValue('message', s.text)}
                            className="text-xs p-3 bg-card border rounded-xl hover:bg-muted transition-colors text-left font-medium flex items-center gap-2 group"
                        >
                            <span className="shrink-0 group-hover:scale-110 transition-transform">{s.icon}</span>
                            <span className="truncate">{s.text}</span>
                        </button>
                    ))}
                </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div 
                key={index} 
                className={cn(
                    "flex flex-col gap-3 max-w-[85%]",
                    message.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}
            >
              <div className="flex items-center gap-2 px-1">
                  {message.role === 'model' ? (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">AI Assistant</span>
                  ) : (
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">You</span>
                  )}
              </div>

              <div className="group relative">
                {message.media && (
                    <div className="mb-3 overflow-hidden rounded-2xl border shadow-sm">
                        {message.media.type.startsWith('image/') ? (
                            <NextImage src={message.media.url} alt="User Upload" width={400} height={400} className="w-full h-auto object-cover" />
                        ) : (
                            <video src={message.media.url} controls className="w-full" />
                        )}
                    </div>
                )}
                
                <div className={cn(
                    'p-4 rounded-3xl text-sm leading-relaxed shadow-sm prose dark:prose-invert max-w-none',
                    message.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-card border rounded-tl-none'
                )}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>

                {message.role === 'model' && (
                    <div className="absolute top-0 -right-12 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full bg-card border"
                            onClick={() => handleCopy(message.content, index)}
                        >
                            {copiedId === index ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                    </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex flex-col gap-3 mr-auto items-start animate-pulse">
                <span className="text-[10px] font-bold text-primary uppercase tracking-tighter px-1">Thinking...</span>
                <div className="bg-card border rounded-3xl rounded-tl-none p-5 flex items-center gap-3">
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer / Input */}
      <div className="fixed bottom-16 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-background via-background/95 to-transparent z-40">
        <div className="container mx-auto max-w-3xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {mediaPreview && (
                <div className="relative mb-2 p-1.5 bg-card border rounded-2xl w-fit animate-in zoom-in-95">
                  {mediaType?.startsWith('image/') ? (
                    <NextImage src={mediaPreview} alt="Preview" width={100} height={100} className="rounded-xl object-cover aspect-square" />
                  ) : (
                    <video src={mediaPreview} width="160" className="rounded-xl aspect-video object-cover" />
                  )}
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon" 
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg border-2 border-background" 
                    onClick={() => { setMediaPreview(null); setMediaType(null); if(mediaInputRef.current) mediaInputRef.current.value = ''; }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative flex items-center bg-card border rounded-[2rem] shadow-lg p-1.5 transition-shadow focus-within:ring-2 focus-within:ring-primary/20">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-full hover:bg-muted" 
                            onClick={() => mediaInputRef.current?.click()} 
                            disabled={isLoading}
                        >
                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <input type="file" accept="image/*,video/*" ref={mediaInputRef} className="hidden" onChange={handleFileChange} />
                        
                        <Input 
                            placeholder="Message AI Assistant..." 
                            autoComplete="off" 
                            className="h-11 border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm px-2" 
                            {...field} 
                        />
                        
                        <Button 
                            type="submit" 
                            size="icon" 
                            className="h-10 w-10 rounded-full shrink-0 shadow-sm" 
                            disabled={isLoading || (!form.getValues().message.trim() && !mediaPreview)}
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <p className="text-[10px] text-center text-muted-foreground opacity-50">
                AI may generate inaccurate info. Max file size: {MAX_FILE_SIZE_MB}MB.
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
