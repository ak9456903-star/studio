'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, User as UserIcon } from 'lucide-react';
import { signOut } from 'firebase/auth';

export default function ProfilePage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
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
    <main className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
            <AvatarFallback>
              <UserIcon className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">
            {user.isAnonymous ? 'Guest User' : user.displayName || user.email}
          </CardTitle>
          {!user.isAnonymous && (
            <CardDescription>{user.email}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <Button onClick={handleSignOut} variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
             {user.isAnonymous && (
              <Card className="bg-muted border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">You are a Guest</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign up to save your history and unlock all features.
                  </p>
                  <Button className="w-full" onClick={() => router.push('/login')}>
                    Sign Up / Log In
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
