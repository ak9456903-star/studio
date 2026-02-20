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
import { Loader2, Settings2, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  apiUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof profileSchema>;

const CUSTOM_API_URL_KEY = 'customApiUrl';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
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
    const savedApi = localStorage.getItem(CUSTOM_API_URL_KEY);
    if (savedApi) form.setValue('apiUrl', savedApi);
  }, [form]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (data.apiUrl) localStorage.setItem(CUSTOM_API_URL_KEY, data.apiUrl);
      else localStorage.removeItem(CUSTOM_API_URL_KEY);

      toast({
        title: "Settings Saved",
        description: "Your configurations have been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Error Saving",
        description: "Could not save your settings. Please try again.",
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
    <main className="container mx-auto max-w-3xl px-4 py-8 pb-24">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
          <Settings2 className="h-8 w-8" />
          Profile & Settings
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Manage your AI and account configurations 🛠️
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="rounded-2xl border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">AI Configuration</CardTitle>
              </div>
              <CardDescription>
                Provide your own API endpoint for custom analysis or scripts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="apiUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endpoint URL</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-background/50 border-primary/10 focus:border-primary"
                        placeholder="https://your-api.com/analyze"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full rounded-2xl text-lg py-7 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading && (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            )}
            Save All Settings
          </Button>
        </form>
      </Form>
    </main>
  );
}
