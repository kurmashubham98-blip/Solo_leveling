'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { SocketProvider } from '@/lib/SocketContext';
import Sidebar from '@/components/Sidebar';
import styles from './layout.module.css';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { player, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !player) {
      router.push('/');
    }
  }, [player, loading, router]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner" style={{ width: 48, height: 48 }} />
        <p>Loading your hunter profile...</p>
      </div>
    );
  }

  if (!player) return null;

  return (
    <SocketProvider>
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </SocketProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
