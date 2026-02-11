'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmail, logOut } from '@/lib/firebase';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { Shield, ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { requireNoAuth } from '@/lib/routeGuards';
import { paths } from '@/lib/paths';

export default function AdminLoginPage() {
  const router = useRouter();
  const { firebaseUser, user, loading: authLoading, isInitialized, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Wait for initialization before making redirect decisions
    if (!isInitialized || authLoading) return;

    // If already authenticated as admin, keep them out of the login page
    if (user && user.role === 'admin') {
      router.replace(paths.admin.root);
      return;
    }

    // If any authenticated user hits this page but isn't an admin, send to dashboard
    if (firebaseUser && (!user || user.role !== 'admin')) {
      router.replace(paths.dashboard.root);
      return;
    }
  }, [firebaseUser, user, authLoading, isInitialized, router]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign in with Firebase
      await signInWithEmail(formData.email, formData.password);
      
      // Get user data from backend to verify admin role
      const response = await authAPI.getMe();
      const userData = response.data.data.user;

      if (userData.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        await logOut(); // Sign out non-admin users from Firebase
        setLoading(false);
        return;
      }

      await refreshUser();
      toast.success('Welcome to Admin Dashboard!');
      router.push(paths.admin.root);
    } catch (error: any) {
      console.error('Admin login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error('Invalid email or password');
      } else if (error.code === 'auth/invalid-credential') {
        toast.error('Invalid credentials');
      } else {
        toast.error(error.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back Link */}
        <Link
          href={paths.home}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Login Card */}
        <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Login</h1>
            <p className="text-gray-400 mt-2">Sign in to access the admin dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="admin-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Shield className="w-4 h-4 mr-2" />
              Sign In as Admin
            </Button>
          </form>

          {/* Footer Note */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Only authorized administrators can access this portal.
          </p>
        </div>
      </div>
    </div>
  );
}
