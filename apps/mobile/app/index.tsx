import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';

export default function EntryScreen() {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}

