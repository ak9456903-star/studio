'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, User as UserIcon, Mail, ShieldCheck } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      router.push('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const userInitial = user.displayName?.[0] || user.email?.[0] || 'U';

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12 pb-24">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
          My Account
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Your profile details and session management 🛡️
        </p>
      </div>

      <Card className="rounded-3xl border-primary/20 bg-card/40 backdrop-blur-xl overflow-hidden shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <Avatar className="h-24 w-24 border-4 border-primary/30 relative z-10">
                <AvatarImage src={user.photoURL || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                  {userInitial.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {user.displayName || 'Creator'}
          </CardTitle>
          <CardDescription className="flex items-center justify-center gap-1.5 text-primary/70">
            <ShieldCheck className="h-4 w-4" />
            Verified Creator Account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
             <div className="flex items-center gap-4 p-4 bg-background/40 rounded-2xl border border-primary/5">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Display Name</p>
                <p className="text-sm font-medium text-zinc-200">{user.displayName || 'Not Set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-background/40 rounded-2xl border border-primary/5">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Email Address</p>
                <p className="text-sm font-medium text-zinc-200">{user.email}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSignOut}
            variant="destructive"
            className="w-full rounded-2xl text-md py-6 font-bold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          >
            <LogOut className="h-5 w-5" />
            Sign Out from Session
          </Button>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground opacity-30">
          Powered by Desi Content AI
        </p>
      </div>
    </main>
  );
}
