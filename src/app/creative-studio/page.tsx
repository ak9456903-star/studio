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
import { Loader2, Download, ImageIcon, Video, Sparkles } from 'lucide-react';
import NextImage from 'next/image';
import { generateImage } from '@/ai/flows/image-generator';
import { generateVideo } from '@/ai/flows/video-generator';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const maxDuration = 120; // 2 minutes timeout for video generation

const photoSchema = z.object({
  prompt: z.string().min(5, { message: 'Prompt must be at least 5 characters.' }),
});

const videoSchema = z.object({
  prompt: z.string().min(5, { message: 'Prompt must be at least 5 characters.' }),
  duration: z.array(z.number()).default([5]),
});

type PhotoFormValues = z.infer<typeof photoSchema>;
type VideoFormValues = z.infer<typeof videoSchema>;

export default function CreativeStudioPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);
  
  const photoForm = useForm<PhotoFormValues>({
    resolver: zodResolver(photoSchema),
    defaultValues: { prompt: '' },
  });

  const videoForm = useForm<VideoFormValues>({
    resolver: zodResolver(videoSchema),
    defaultValues: { prompt: '', duration: [5] },
  });

  const onPhotoSubmit = async (data: PhotoFormValues) => {
    if (!user) return;
    setIsLoading(true);
    setGeneratedImageUrl(null);
    setGeneratedVideoUrl(null);
    setCurrentPrompt(data.prompt);

    try {
      const result = await generateImage({ prompt: data.prompt });
      setGeneratedImageUrl(result.imageUrl);
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        variant: 'destructive',
        title: 'Image Generation Failed',
        description: 'Something went wrong while creating your image.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onVideoSubmit = async (data: VideoFormValues) => {
    if (!user) return;
    setIsLoading(true);
    setGeneratedImageUrl(null);
    setGeneratedVideoUrl(null);
    setCurrentPrompt(data.prompt);

    try {
      const result = await generateVideo({ prompt: data.prompt, duration: data.duration[0] });
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Video Generation Failed',
          description: result.error,
        });
      } else if (result.videoUrl) {
        setGeneratedVideoUrl(result.videoUrl);
      }
    } catch (error) {
      console.error('Error generating video:', error);
      toast({
        variant: 'destructive',
        title: 'Video Generation Failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (url: string, prompt: string, type: 'photo' | 'video') => {
    const link = document.createElement('a');
    link.href = url;
    const filename = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50) || `generated-${type}`;
    link.download = `${filename}.${type === 'photo' ? 'png' : 'mp4'}`;
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
    <main className="container mx-auto max-w-5xl px-4 py-8 pb-24">
       <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8" />
          Creative Studio
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Turn your imagination into stunning photos and videos 🎨🎬
        </p>
      </div>

      <Tabs defaultValue="photo" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
          <TabsTrigger value="photo" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            AI Photo
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            AI Video
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photo">
          <Card className="w-full mx-auto rounded-xl shadow-md mb-8">
            <CardHeader>
              <CardTitle>Generate a New Image</CardTitle>
              <CardDescription>
                Describe the image you want to create. Be as descriptive as possible!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...photoForm}>
                <form onSubmit={photoForm.handleSubmit(onPhotoSubmit)} className="space-y-6">
                  <FormField
                    control={photoForm.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Prompt</FormLabel>
                        <FormControl>
                          <Input
                            className="rounded-lg"
                            placeholder="e.g., A majestic lion with a crown of stars, fantasy art"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full rounded-lg text-lg py-6 bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Generate Photo
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video">
          <Card className="w-full mx-auto rounded-xl shadow-md mb-8">
            <CardHeader>
              <CardTitle>Generate a New Video</CardTitle>
              <CardDescription>
                Describe the video you want to create. This can take a minute or two.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...videoForm}>
                <form onSubmit={videoForm.handleSubmit(onVideoSubmit)} className="space-y-6">
                  <FormField
                    control={videoForm.control}
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
                    control={videoForm.control}
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
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Generate Video
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {(isLoading || generatedImageUrl || generatedVideoUrl) && (
        <Card className="w-full mx-auto rounded-xl shadow-md mb-8 overflow-hidden">
            <CardHeader>
                <CardTitle>Your Creation</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-6 bg-muted/20">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[320px] w-full gap-4 rounded-lg border-2 border-dashed">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground font-medium">Creating your masterpiece...</p>
                    <p className="text-sm text-muted-foreground text-center px-4">
                      {generatedVideoUrl === null && generatedImageUrl === null && videoForm.formState.isSubmitted 
                        ? 'This can take up to 2 minutes. Please wait.' 
                        : 'Generating your image, almost there!'}
                    </p>
                </div>
            ) : (
                <div className="relative group w-full max-w-2xl">
                    {generatedImageUrl ? (
                      <div className="relative aspect-square">
                        <NextImage src={generatedImageUrl} alt={currentPrompt} fill className="object-cover rounded-lg" />
                      </div>
                    ) : generatedVideoUrl ? (
                      <div className="relative aspect-video">
                        <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full rounded-lg object-contain" />
                      </div>
                    ) : null}
                    
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg backdrop-blur-sm">
                        <Button 
                          variant="secondary" 
                          className="shadow-lg"
                          onClick={() => handleDownload(
                            (generatedImageUrl || generatedVideoUrl)!, 
                            currentPrompt, 
                            generatedImageUrl ? 'photo' : 'video'
                          )}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download Now
                        </Button>
                    </div>
                </div>
            )}
            </CardContent>
        </Card>
      )}
    </main>
  );
}
