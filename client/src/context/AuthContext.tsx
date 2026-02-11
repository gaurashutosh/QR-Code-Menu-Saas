'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, logOut, FirebaseUser } from '@/lib/firebase';
import { authAPI } from '@/lib/api';

interface User {
  _id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: string;
}

interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
  menuViewCount?: number;
}

interface Subscription {
  plan: string;
  status: string;
  isActive: boolean;
  daysRemaining: number;
  currentPeriodEnd?: string;
  billingCycle?: string;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  restaurant: Restaurant | null;
  subscription: Subscription | null;
  /**
   * True while we are determining the current auth state and loading profile data.
   * Use this to avoid redirect flicker while Firebase initializes.
   */
  loading: boolean;
  /**
   * True once the initial authentication check (Firebase + Profile) has completed.
   */
  isInitialized: boolean;
  error: string | null;
  /**
   * Convenience booleans derived from the raw auth state.
   * Prefer these helpers in routing/layout logic instead of re-deriving conditions per page.
   */
  isAuthenticated: boolean;
  isAdmin: boolean;
  isRestaurantOnboarded: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  user: null,
  restaurant: null,
  subscription: null,
  loading: true,
  isInitialized: false,
  error: null,
  isAuthenticated: false,
  isAdmin: false,
  isRestaurantOnboarded: false,
  signOut: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const response = await authAPI.getMe();
      const { user, restaurant, subscription } = response.data.data;
      setUser(user);
      setRestaurant(restaurant);
      setSubscription(subscription);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'Failed to connect to the server');
      setUser(null);
      setRestaurant(null);
      setSubscription(null);
    }
  };

  useEffect(() => {
    let loadingTimeout: NodeJS.Timeout;
    
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      try {
        if (fbUser) {
          setLoading(true);
          await fetchUserData();
        } else {
          setUser(null);
          setRestaurant(null);
          setSubscription(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
        setIsInitialized(true);
        clearTimeout(loadingTimeout);
      }
    });

    // Fallback timeout: ensure loading is set to false within 15 seconds
    loadingTimeout = setTimeout(() => {
      console.warn('Auth initialization timeout - setting loading to false');
      setLoading(false);
    }, 15000);

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const handleSignOut = async () => {
    await logOut();
    setUser(null);
    setRestaurant(null);
    setSubscription(null);
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await fetchUserData();
    }
  };

  const isAuthenticated = !!user && !!firebaseUser;
  const isAdmin = !!user && user.role === 'admin';
  const isRestaurantOnboarded = !!restaurant;

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        restaurant,
        subscription,
        loading,
        isInitialized,
        error,
        isAuthenticated,
        isAdmin,
        isRestaurantOnboarded,
        signOut: handleSignOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
