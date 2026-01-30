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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  apiUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

const CUSTOM_API_URL_KEY = 'customApiUrl';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiUrl: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    // Load saved API URL from localStorage
    const savedApiUrl = localStorage.getItem(CUSTOM_API_URL_KEY);
    if (savedApiUrl) {
      form.setValue('apiUrl', savedApiUrl);
    }
  }, [form]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (data.apiUrl) {
        localStorage.setItem(CUSTOM_API_URL_KEY, data.apiUrl);
      } else {
        localStorage.removeItem(CUSTOM_API_URL_KEY);
      }
      toast({
        title: "Settings Saved",
        description: "Your custom API endpoint has been updated.",
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Error Saving",
        description: "Could not save your settings.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Profile & Settings
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Manage your application settings.
        </p>
      </div>

      <Card className="w-full mx-auto rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Custom AI Endpoint</CardTitle>
          <CardDescription>
            Optionally, provide your own API endpoint for content analysis. 
            Leave blank to use the default built-in AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="apiUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your API Endpoint URL</FormLabel>
                    <FormControl>
                      <Input
                        className="rounded-lg"
                        placeholder="https://your-api.com/analyze"
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
                Save Settings
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
