'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Image as ImageIcon, Download } from 'lucide-react';
import NextImage from 'next/image';
import { generateImage } from '@/ai/flows/image-generator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  prompt: z.string().min(5, { message: 'Prompt must be at least 5 characters.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ImageCreatorPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);
  
  const imagesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'images'), orderBy('createdAt', 'desc'));
  }, [user, firestore]);
  
  const { data: userImages, isLoading: isLoadingImages } = useCollection<{ prompt: string, imageUrl: string, createdAt: any }>(imagesQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: '' },
  });

  const onSubmit = async (data: FormValues) => {
    if (!user || !firestore) return;
    setIsLoading(true);
    setGeneratedImageUrl(null);
    setCurrentPrompt(data.prompt);

    try {
      const result = await generateImage({ prompt: data.prompt });
      setGeneratedImageUrl(result.imageUrl);
      
      const imageRecord = {
        userId: user.uid,
        prompt: data.prompt,
        imageUrl: result.imageUrl, // This will be a large data URI string
        createdAt: serverTimestamp(),
      };
      
      const colRef = collection(firestore, 'users', user.uid, 'images');
      addDocumentNonBlocking(colRef, imageRecord);

    } catch (error) {
      console.error('Error generating image:', error);
      // TODO: Show toast on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (imageUrl: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    const filename = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50) || 'generated-image';
    link.download = `${filename}.png`;
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
          AI Photo Creator
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Turn your imagination into stunning images 🎨
        </p>
      </div>

      <Card className="w-full mx-auto rounded-xl shadow-md mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Generate a New Image</CardTitle>
          <CardDescription>
            Describe the image you want to create. Be as descriptive as possible!
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
                {isLoading && (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                )}
                Generate Image
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {(isLoading || generatedImageUrl) && (
        <Card className="w-full mx-auto rounded-xl shadow-md mb-8">
            <CardHeader>
                <CardTitle>Your New Creation</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-6">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-80 w-80 gap-4 rounded-lg border-2 border-dashed">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Generating your masterpiece...</p>
                    <p className="text-sm text-muted-foreground text-center px-4">This can take up to 30 seconds.</p>
                </div>
            ) : generatedImageUrl ? (
                <div className="relative group w-80 h-80">
                    <NextImage src={generatedImageUrl} alt={currentPrompt} fill className="object-cover rounded-lg" />
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <Button variant="outline" onClick={() => handleDownload(generatedImageUrl, currentPrompt)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    </div>
                </div>
            ) : null}
            </CardContent>
        </Card>
      )}

      <Card className="w-full mx-auto rounded-xl shadow-md">
        <CardHeader>
          <CardTitle>Your Gallery</CardTitle>
          <CardDescription>
            Images you have created before. Hover to see details and download.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] w-full">
            {isLoadingImages ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
                 </div>
            ) : userImages && userImages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                    {userImages.map((image) => (
                        <div key={image.id} className="relative group aspect-square">
                            <NextImage src={image.imageUrl} alt={image.prompt} fill className="object-cover rounded-lg" />
                            <div className="absolute inset-0 bg-black/70 p-2 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white">
                                <p className="text-xs line-clamp-4">{image.prompt}</p>
                                <Button size="sm" variant="secondary" className="w-full" onClick={() => handleDownload(image.imageUrl, image.prompt)}>
                                    <Download className="mr-2 h-4 w-4" /> Download
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
                    <div className='text-center'>
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground mt-2">
                         Your generated images will appear here.
                        </p>
                    </div>
                </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </main>
  );
}
