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
import { Loader2, DollarSign, Settings2, Globe, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const profileSchema = z.object({
  apiUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  adMobClientId: z.string().min(1, "Client ID is required for ads").optional().or(z.literal('')),
  adUnitId: z.string().min(1, "Ad Unit ID is required").optional().or(z.literal('')),
  rewardAdUnitId: z.string().min(1, "Reward Ad Unit ID is required").optional().or(z.literal('')),
});

type FormValues = z.infer<typeof profileSchema>;

const CUSTOM_API_URL_KEY = 'customApiUrl';
const ADMOB_CLIENT_ID_KEY = 'adMobClientId';
const ADMOB_UNIT_ID_KEY = 'adMobUnitId';
const REWARD_AD_UNIT_ID_KEY = 'rewardAdUnitId';

// User's provided IDs
const DEFAULT_CLIENT_ID = 'ca-pub-6437039380428423';
const DEFAULT_UNIT_ID = '2652653143';
const DEFAULT_REWARD_ID = '6912306240';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      apiUrl: '',
      adMobClientId: DEFAULT_CLIENT_ID,
      adUnitId: DEFAULT_UNIT_ID,
      rewardAdUnitId: DEFAULT_REWARD_ID,
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    // Load saved settings from localStorage or fallback to defaults
    const savedApi = localStorage.getItem(CUSTOM_API_URL_KEY);
    const savedClient = localStorage.getItem(ADMOB_CLIENT_ID_KEY);
    const savedUnit = localStorage.getItem(ADMOB_UNIT_ID_KEY);
    const savedReward = localStorage.getItem(REWARD_AD_UNIT_ID_KEY);

    if (savedApi) form.setValue('apiUrl', savedApi);
    form.setValue('adMobClientId', savedClient || DEFAULT_CLIENT_ID);
    form.setValue('adUnitId', savedUnit || DEFAULT_UNIT_ID);
    form.setValue('rewardAdUnitId', savedReward || DEFAULT_REWARD_ID);
  }, [form]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (data.apiUrl) localStorage.setItem(CUSTOM_API_URL_KEY, data.apiUrl);
      else localStorage.removeItem(CUSTOM_API_URL_KEY);

      if (data.adMobClientId) localStorage.setItem(ADMOB_CLIENT_ID_KEY, data.adMobClientId);
      else localStorage.removeItem(ADMOB_CLIENT_ID_KEY);

      if (data.adUnitId) localStorage.setItem(ADMOB_UNIT_ID_KEY, data.adUnitId);
      else localStorage.removeItem(ADMOB_UNIT_ID_KEY);

      if (data.rewardAdUnitId) localStorage.setItem(REWARD_AD_UNIT_ID_KEY, data.rewardAdUnitId);
      else localStorage.removeItem(REWARD_AD_UNIT_ID_KEY);

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
          Manage your AI and Monetization configurations 🛠️
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                AI Configuration
              </TabsTrigger>
              <TabsTrigger value="monetization" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Monetization
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card className="rounded-2xl border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl">Custom AI Endpoint</CardTitle>
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
            </TabsContent>

            <TabsContent value="monetization">
              <Card className="rounded-2xl border-accent/20 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl text-accent">AdMob / AdSense Integration</CardTitle>
                  <CardDescription>
                    Configure your monetization IDs to start earning from your content hub.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="adMobClientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client ID (e.g., ca-pub-xxxxxxxx)</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-background/50 border-accent/10 focus:border-accent"
                            placeholder="ca-pub-0000000000000000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adUnitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Standard Ad Unit ID</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-background/50 border-accent/10 focus:border-accent"
                            placeholder="1234567890"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rewardAdUnitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rewarded Ad Unit ID</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-background/50 border-accent/10 focus:border-accent"
                            placeholder="6912306240"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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
