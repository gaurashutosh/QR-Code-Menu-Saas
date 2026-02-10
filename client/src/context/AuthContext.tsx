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
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  restaurant: Restaurant | null;
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  user: null,
  restaurant: null,
  subscription: null,
  loading: true,
  error: null,
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
      setError(err.message);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        await fetchUserData();
      } else {
        setUser(null);
        setRestaurant(null);
        setSubscription(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
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

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        restaurant,
        subscription,
        loading,
        error,
        signOut: handleSignOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
