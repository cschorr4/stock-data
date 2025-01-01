import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from '@/utils/supabase/client';
import { Loader2, CheckCircle2, XCircle, LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from '@/components/providers/AuthProvider';

type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

interface AuthDialogProps {
  showInitially?: boolean;
}

export function AuthDialog({ showInitially = false }: AuthDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [open, setOpen] = useState(showInitially);
  const [isSignUp, setIsSignUp] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    setOpen(showInitially);
  }, [showInitially]);

  const handleSignOut = async () => {
    setAuthStatus('loading');
    try {
      await supabase.auth.signOut();
      setAuthStatus('success');
      toast({
        title: "Success",
        description: "Successfully signed out"
      });
      router.push('/login');
    } catch (error: any) {
      setAuthStatus('error');
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sign out"
      });
    }
  };

  if (user) {
    return (
      <Button 
        onClick={handleSignOut} 
        variant="outline" 
        className="w-full flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    );
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthStatus('loading');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            firstName,
            lastName,
            username: email.split('@')[0],
          }
        }
      });

      if (error) throw error;

      if (data?.user) {
        setAuthStatus('success');
        toast({
          title: "Account created!",
          description: "Please check your email to confirm your account.",
        });
        
        setTimeout(() => {
          setOpen(false);
          setAuthStatus('idle');
        }, 2000);
      }
    } catch (error: any) {
      setAuthStatus('error');
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create account",
      });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthStatus('loading');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setAuthStatus('success');
      toast({
        title: "Success",
        description: "Successfully signed in",
      });
      
      setTimeout(() => {
        setOpen(false);
        setAuthStatus('idle');
      }, 2000);
    } catch (error: any) {
      setAuthStatus('error');
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Invalid credentials",
      });
    }
  };

  const renderContent = () => {
    switch (authStatus) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? 'Creating your account...' : 'Signing you in...'}
            </p>
          </div>
        );
      
      case 'success':
        return (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? 'Account created! Check your email.' : 'Successfully signed in!'}
            </p>
          </div>
        );
      
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <XCircle className="h-8 w-8 text-destructive" />
            <p className="text-center text-sm text-destructive">Something went wrong</p>
            <Button onClick={() => setAuthStatus('idle')} variant="outline">
              Try Again
            </Button>
          </div>
        );
      
      default:
        return (
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required={isSignUp}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required={isSignUp}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthStatus('idle');
                }}
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!showInitially && (
        <Button onClick={() => setOpen(true)} variant="outline">
          Sign {isSignUp ? 'Up' : 'In'}
        </Button>
      )}
      
      <DialogContent>
        <DialogTitle>{isSignUp ? 'Create Account' : 'Sign In'}</DialogTitle>
        <DialogDescription>
          {isSignUp ? 'Create a new account' : 'Sign in to your account'}
        </DialogDescription>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}