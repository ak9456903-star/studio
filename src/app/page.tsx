'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Balancer } from 'react-wrap-balancer';
import {
  generateContent,
  type GenerateContentInput,
} from '@/ai/flows/content-generator';
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
  Hash,
  Instagram,
  Loader2,
  MessageSquareText,
  Quote,
  Sparkles,
  UserSquare2,
  Youtube,
} from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  topic: z.string().min(2, {
    message: 'Topic must be at least 2 characters.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

const toolsByCategory = [
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
  const [isLoading, setIsLoading] = useState(false);

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
    try {
      const result = await generateContent({
        taskType: selectedTaskType,
        topic: data.topic,
      });
      setGeneratedContent(result);
    } catch (error) {
      console.error('Error generating content:', error);
      setGeneratedContent('Failed to generate content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskSelect = (taskName: string) => {
    setSelectedTaskType(taskName);
    setGeneratedContent('');
    form.reset();
  };

  if (selectedTaskType) {
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
              Enter a topic to generate content.
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
                      <FormLabel>Topic</FormLabel>
                      <FormControl>
                        <Input
                          className="rounded-lg"
                          placeholder="e.g., Diwali celebration, new recipe..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full rounded-lg text-lg py-6"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  )}
                  Generate Content
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
        <h1 className="text-4xl font-bold tracking-tight text-accent">
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
                  onClick={() => handleTaskSelect(task.name)}
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
