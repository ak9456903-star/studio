'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2, History as HistoryIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function HistoryPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <HistoryIcon className="h-6 w-6" />
            Chat History
          </CardTitle>
          <CardDescription>
            Your past conversations will appear here.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed mt-8">
          <p className="text-muted-foreground">
            No history yet. Start a new chat!
          </p>
        </div>
    </main>
  );
}
