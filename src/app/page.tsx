'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Balancer } from 'react-wrap-balancer';
import NextImage from 'next/image';
import {
  generateContent,
  type GenerateContentInput,
} from '@/ai/flows/content-generator';
import { generateThumbnail } from '@/ai/flows/thumbnail-generator';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  ChevronRight,
  Clapperboard,
  Download,
  Hash,
  Instagram,
  Loader2,
  MessageCircle,
  MessageSquareText,
  Quote,
  Sparkles,
  UserSquare2,
  Youtube,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useUser } from '@/firebase';

const formSchema = z.object({
  topic: z.string().min(2, {
    message: 'Topic must be at least 2 characters.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

type Task = {
  name: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
};

const toolsByCategory: { category: string; icon: React.ReactNode; tasks: Task[] }[] = [
  {
    category: 'Instagram',
    icon: <Instagram className="h-6 w-6" />,
    tasks: [
      {
        name: 'Instagram Caption',
        description: 'Generate viral captions for your posts.',
        icon: <MessageSquareText className="h-8 w-8 text-primary" />,
      },
      {
        name: 'Instagram Bio',
        description: 'Create a cool and professional bio.',
        icon: <UserSquare2 className="h-8 w-8 text-primary" />,
      },
    ],
  },
  {
    category: 'YouTube',
    icon: <Youtube className="h-6 w-6" />,
    tasks: [
      {
        name: 'YouTube Title',
        description: 'Get click-worthy titles for your videos.',
        icon: <Clapperboard className="h-8 w-8 text-primary" />,
      },
      {
        name: 'YouTube Thumbnail',
        description: 'Generate a thumbnail from a video title.',
        icon: <ImageIcon className="h-8 w-8 text-primary" />,
      },
    ],
  },
  {
    category: 'AI Assistant',
    icon: <MessageCircle className="h-6 w-6" />,
    tasks: [
        {
            name: 'Chat with Gemini',
            description: 'Have a conversation with our AI assistant.',
            icon: <Sparkles className="h-8 w-8 text-primary" />,
            href: '/chat'
        }
    ]
  },
  {
    category: 'Creative Tools',
    icon: <Sparkles className="h-6 w-6" />,
    tasks: [
      {
        name: 'AI Photo Creator',
        description: 'Turn your text prompts into images.',
        icon: <ImageIcon className="h-8 w-8 text-primary" />,
        href: '/image-creator',
      },
      {
        name: 'AI Video Creator',
        description: 'Bring your ideas to life with video.',
        icon: <Video className="h-8 w-8 text-primary" />,
        href: '/video-creator',
      },
    ],
  },
  {
    category: 'General',
    icon: <Sparkles className="h-6 w-6" />,
    tasks: [
      {
        name: 'Hashtag Generator',
        description: 'Find the best hashtags to boost reach.',
        icon: <Hash className="h-8 w-8 text-primary" />,
      },
      {
        name: 'Motivation/Bhakti',
        description: 'Inspirational quotes in simple Hindi.',
        icon: <Quote className="h-8 w-8 text-primary" />,
      },
    ],
  },
];

export default function CreatePage() {
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!selectedTaskType) return;

    setIsLoading(true);
    setGeneratedContent('');
    setGeneratedImageUrl('');

    try {
      if (selectedTaskType === 'YouTube Thumbnail') {
        const result = await generateThumbnail({ title: data.topic });
        setGeneratedImageUrl(result.imageUrl);
      } else {
        const result = await generateContent({
          taskType: selectedTaskType,
          topic: data.topic,
        });
        setGeneratedContent(result);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setGeneratedContent('Failed to generate content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskSelect = (task: Task) => {
    if (task.href) {
      router.push(task.href);
      return;
    }
    setSelectedTaskType(task.name);
    setGeneratedContent('');
    setGeneratedImageUrl('');
    form.reset();
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


  if (selectedTaskType) {
    const isImageTask = selectedTaskType === 'YouTube Thumbnail';
    const currentTopic = form.watch('topic');

    return (
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => setSelectedTaskType(null)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all tools
        </Button>
        <Card className="w-full max-w-2xl mx-auto rounded-xl shadow-md mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{selectedTaskType}</CardTitle>
            <CardDescription>
              {isImageTask
                ? 'Enter a video title to generate a thumbnail.'
                : 'Enter a topic to generate content.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isImageTask ? 'Video Title' : 'Topic'}</FormLabel>
                      <FormControl>
                        <Input
                          className="rounded-lg"
                          placeholder={
                            isImageTask
                              ? 'e.g., My Awesome Trip to Manali'
                              : 'e.g., Diwali celebration, new recipe...'
                          }
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
                  {isImageTask ? 'Generate Thumbnail' : 'Generate Content'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="w-full max-w-2xl mx-auto rounded-xl shadow-md min-h-[300px]">
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>
              Your AI-generated content will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Generating...</p>
              </div>
            ) : generatedImageUrl ? (
              <div className="relative group aspect-video">
                <NextImage src={generatedImageUrl} alt={currentTopic} fill className="object-contain rounded-lg" />
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <Button variant="outline" onClick={() => handleDownload(generatedImageUrl, currentTopic)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                </div>
              </div>
            ) : generatedContent ? (
              <div className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm font-mono">
                <Balancer>{generatedContent}</Balancer>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">
                  Your content will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight" style={{color: 'hsl(var(--primary))'}}>
          Desi Content Creator
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Your one-stop AI for viral Indian content 🇮🇳
        </p>
      </div>

      <div className="space-y-8">
        {toolsByCategory.map((category) => (
          <div key={category.category}>
            <h2 className="flex items-center gap-2 text-xl font-semibold mb-4">
              {category.icon}
              {category.category}
            </h2>
            <div className="space-y-4">
              {category.tasks.map((task) => (
                <Card
                  key={task.name}
                  className="w-full max-w-2xl mx-auto rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleTaskSelect(task)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {task.icon}
                      <div>
                        <h3 className="font-semibold text-lg">{task.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
