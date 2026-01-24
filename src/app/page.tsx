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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  taskType: z.string({
    required_error: 'Please select a task type.',
  }),
  topic: z.string().min(2, {
    message: 'Topic must be at least 2 characters.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

const taskTypes = [
  'Instagram Caption',
  'YouTube Title',
  'Instagram Bio',
  'Hashtag Generator',
  'Motivation/Bhakti',
];

export default function Home() {
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setGeneratedContent('');
    try {
      const result = await generateContent(data as GenerateContentInput);
      setGeneratedContent(result);
    } catch (error) {
      console.error('Error generating content:', error);
      setGeneratedContent('Failed to generate content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <h1 className="text-2xl font-bold">AI Content Generator</h1>
          <p className="text-sm text-sidebar-foreground/70">For Indian Users 🇮🇳</p>
        </SidebarHeader>
        <SidebarContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-2">
              <FormField
                control={form.control}
                name="taskType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a task" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {taskTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Input Topic</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Diwali celebration, new recipe..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Content
              </Button>
            </form>
          </Form>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <main className="flex-1 p-6">
          <div className="flex h-full items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Generating content...</p>
              </div>
            ) : (
              <Card className="w-full max-w-3xl min-h-[400px]">
                <CardHeader>
                  <CardTitle>Generated Content</CardTitle>
                  <CardDescription>
                    Here&apos;s the AI-generated content based on your inputs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedContent ? (
                    <div className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
                      <Balancer>{generatedContent}</Balancer>
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-md border-2 border-dashed">
                      <p className="text-muted-foreground">
                        Your content will appear here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
