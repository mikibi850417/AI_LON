"use client";

import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import UserSettingsForm from "@/app/components/UserSettingsForm";

export default function DashboardSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
          router.push('/auth/login');
          return;
        }
        setSessionChecked(true);
      } catch (error) {
        console.error('세션 확인 중 오류 발생:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      {sessionChecked && <UserSettingsForm />}
    </div>
  );
}
