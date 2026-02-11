'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QrCode, Mail, Lock, Eye, EyeOff, User as UserIcon } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle, auth } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { requireNoAuth } from '@/lib/routeGuards';
import { paths } from '@/lib/paths';

export default function SignupPage() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading, isInitialized } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    requireNoAuth(
      { firebaseUser, isLoading: authLoading, isInitialized },
      router,
      { redirectTo: paths.dashboard.root }
    );
  }, [firebaseUser, authLoading, isInitialized, router]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signUpWithEmail(email, password);
      
      // Update display name
      try {
        await updateProfile(userCredential.user, {
          displayName: name
        });
      } catch (profileError) {
        console.error('Error updating profile:', profileError);
        // We don't block the flow if profile update fails, 
        // but we log it for debugging
      }

      toast.success('Account created successfully!');
      router.push(paths.dashboard.root);
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak');
      } else {
        toast.error('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome! Signed in successfully.');
      router.push(paths.dashboard.root);
    } catch (error: any) {
      console.error('Google signup error:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error('Failed to sign up with Google');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <QrCode className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">QR Menu</span>
          </Link>
        </div>

        {/* Signup Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Create Your Account
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Start your 7-day free trial
          </p>

          {/* Google Signup */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={handleGoogleSignup}
            loading={googleLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or continue with email</span>
            </div>
          </div>

          {/* Email Signup Form */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="name"
                label="Full Name"
                labelClassName="sr-only"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                autoComplete="name"
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                label="Email Address"
                labelClassName="sr-only"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                autoComplete="email"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                label="Password"
                labelClassName="sr-only"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="confirmPassword"
                label="Confirm Password"
                labelClassName="sr-only"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-gray-600 text-sm">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-orange-600 hover:text-orange-700">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-orange-600 hover:text-orange-700">
              Privacy Policy
            </Link>
          </p>

          <p className="mt-4 text-center text-gray-600">
            Already have an account?{' '}
            <Link href={paths.login} className="text-orange-600 hover:text-orange-700 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
