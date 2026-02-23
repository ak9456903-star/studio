'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useAuth, 
  useUser, 
  initiateEmailSignIn, 
  initiateEmailSignUp, 
} from '@/firebase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const signUpSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password cannot be empty.' }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;
type SignInFormValues = z.infer<typeof signInSchema>;

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  });

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleAuthAction = async (action: 'signIn' | 'signUp', data: any) => {
    setIsLoading(true);
    try {
      if (action === 'signIn') {
        initiateEmailSignIn(auth, data.email, data.password);
      } else if (action === 'signUp') {
        initiateEmailSignUp(auth, data.email, data.password);
      }
    } catch (error: any) {
      console.error(`${action} failed`, error);
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message || `Could not ${action}. Please try again.`,
      });
      setIsLoading(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4 relative overflow-hidden">
      <Tabs defaultValue="sign-in" className="w-full max-w-[400px] relative z-10">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-card/50 backdrop-blur-xl border border-primary/10">
          <TabsTrigger value="sign-in" className="rounded-xl data-[state=active]:bg-primary/20">Sign In</TabsTrigger>
          <TabsTrigger value="sign-up" className="rounded-xl data-[state=active]:bg-primary/20">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="sign-in">
          <Card className="rounded-3xl border-primary/10 bg-card/40 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your creator portal.
              </CardDescription>
            </CardHeader>
            <form onSubmit={signInForm.handleSubmit((data) => handleAuthAction('signIn', data))}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input id="email-signin" type="email" placeholder="m@example.com" className="rounded-xl" {...signInForm.register('email')} />
                  {signInForm.formState.errors.email && <p className="text-xs text-destructive">{signInForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Password</Label>
                  <Input id="password-signin" type="password" className="rounded-xl" {...signInForm.register('password')} />
                   {signInForm.formState.errors.password && <p className="text-xs text-destructive">{signInForm.formState.errors.password.message}</p>}
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full rounded-xl py-6 font-bold" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="sign-up">
          <Card className="rounded-3xl border-primary/10 bg-card/40 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Join DASHI</CardTitle>
              <CardDescription>
                Start your viral content journey today.
              </CardDescription>
            </CardHeader>
            <form onSubmit={signUpForm.handleSubmit((data) => handleAuthAction('signUp', data))}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="m@example.com" className="rounded-xl" {...signUpForm.register('email')} />
                  {signUpForm.formState.errors.email && <p className="text-xs text-destructive">{signUpForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input id="password-signup" type="password" className="rounded-xl" {...signUpForm.register('password')} />
                  {signUpForm.formState.errors.password && <p className="text-xs text-destructive">{signUpForm.formState.errors.password.message}</p>}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full rounded-xl py-6 font-bold" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
