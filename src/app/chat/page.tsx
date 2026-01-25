'use client';

import { useState, useRef, useEffect, ElementRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendMessage, type ChatMessage } from '@/ai/flows/chat-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, User, Sparkles, Copy, ThumbsUp, ThumbsDown, RefreshCw, Paperclip } from 'lucide-react';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  message: z.string().min(1, { message: 'Message cannot be empty.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<ElementRef<typeof ScrollArea>>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { user, isUserLoading } = useUser();
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

  const onSubmit = async (data: FormValues) => {
    const userMessage: ChatMessage = { role: 'user', content: data.message };
    const newMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(newMessages);
    form.reset();
    setIsLoading(true);

    try {
      const aiResponse = await sendMessage({
        messages: newMessages,
        topic: 'General Conversation',
      });
      setMessages((prev) => [...prev, { role: 'model', content: aiResponse }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: 'Sorry, something went wrong. Please try again.' },
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
                <h1 className="text-4xl font-bold mt-4">Gemini</h1>
                <p className="text-muted-foreground mt-2">
                  Start a conversation with your AI assistant.
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
                 <div
                    className={cn(
                      'max-w-full rounded-lg p-3 text-sm prose dark:prose-invert',
                      message.role === 'user'
                        ? 'bg-muted'
                        : 'bg-card'
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
                          onClick={() => imageInputRef.current?.click()}
                        >
                          <Paperclip className="h-5 w-5 text-muted-foreground" />
                          <span className="sr-only">Attach an image</span>
                        </Button>
                        <Input
                          type="file"
                          accept="image/*"
                          ref={imageInputRef}
                          className="hidden"
                        />
                        <Input
                          placeholder="Message Gemini..."
                          autoComplete="off"
                          className="h-12 w-full rounded-full bg-muted pl-12 pr-14 text-base"
                          {...field}
                        />
                        <Button
                          type="submit"
                          size="icon"
                          className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                          disabled={isLoading || !form.formState.isValid}
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
