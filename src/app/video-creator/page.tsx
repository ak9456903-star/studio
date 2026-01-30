'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Download } from 'lucide-react';
import { generateVideo } from '@/ai/flows/video-generator';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

export const maxDuration = 120; // 2 minutes timeout for video generation

const formSchema = z.object({
  prompt: z.string().min(5, { message: 'Prompt must be at least 5 characters.' }),
  duration: z.array(z.number()).default([5]),
});

type FormValues = z.infer<typeof formSchema>;

export default function VideoCreatorPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: '', duration: [5] },
  });

  const onSubmit = async (data: FormValues) => {
    if (!user) return;
    setIsLoading(true);
    setGeneratedVideoUrl(null);
    setCurrentPrompt(data.prompt);

    try {
      const result = await generateVideo({ prompt: data.prompt, duration: data.duration[0] });
      setGeneratedVideoUrl(result.videoUrl);
    } catch (error) {
      console.error('Error generating video:', error);
      toast({
        variant: 'destructive',
        title: 'Video Generation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (videoUrl: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    const filename = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50) || 'generated-video';
    link.download = `${filename}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
       <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          AI Video Creator
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Bring your ideas to life with video 🎬
        </p>
      </div>

      <Card className="w-full mx-auto rounded-xl shadow-md mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Generate a New Video</CardTitle>
          <CardDescription>
            Describe the video you want to create. This can take a minute or two.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Prompt</FormLabel>
                    <FormControl>
                      <Input
                        className="rounded-lg"
                        placeholder="e.g., A majestic dragon soaring over a mystical forest at dawn"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration ({field.value[0]} seconds)</FormLabel>
                    <FormControl>
                      <Slider
                        min={5}
                        max={8}
                        step={1}
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full rounded-lg text-lg py-6 bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={isLoading}
              >
                {isLoading && (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                )}
                Generate Video
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {(isLoading || generatedVideoUrl) && (
        <Card className="w-full mx-auto rounded-xl shadow-md mb-8">
            <CardHeader>
                <CardTitle>Your New Video</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-6">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-80 w-full gap-4 rounded-lg border-2 border-dashed">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Generating your video masterpiece...</p>
                    <p className="text-sm text-muted-foreground text-center px-4">This can take up to 2 minutes. Please be patient.</p>
                </div>
            ) : generatedVideoUrl ? (
                <div className="relative group w-full aspect-video">
                    <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full rounded-lg object-contain" />
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <Button variant="outline" onClick={() => handleDownload(generatedVideoUrl, currentPrompt)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    </div>
                </div>
            ) : null}
            </CardContent>
        </Card>
      )}
    </main>
  );
}
