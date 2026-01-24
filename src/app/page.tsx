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

export default function CreatePage() {
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
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-accent">
          Desi Content Creator
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Your one-stop AI for viral Indian content 🇮🇳
        </p>
      </div>

      <Card className="w-full max-w-2xl mx-auto rounded-xl shadow-md mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Content</CardTitle>
          <CardDescription>
            Select a tool and enter your topic to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <SelectTrigger className="rounded-lg">
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
              <Button type="submit" className="w-full rounded-lg text-lg py-6" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
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
