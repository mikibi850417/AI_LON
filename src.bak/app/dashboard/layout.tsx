'use client';

import React, { useEffect } from 'react';
import { CssBaseline, Box, Toolbar } from '@mui/material';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar'; // 실제 파일 위치에 맞게 경로 조정

const drawerWidth = 240; // 네비게이션 바의 고정 너비
const contentMargin = 20; // 네비게이션 바와의 추가 여백

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // 컴포넌트 마운트 시 로그인 세션 확인 - 임시로 비활성화
  useEffect(() => {
    // 세션 체크 로직을 주석 처리하여 임시로 비활성화
    /*
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        router.push("/auth/login");
      }
    };
    checkSession();
    */
  }, [router]);

  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {/* 왼쪽 네비게이션 Drawer */}
        <Navbar />
        {/* 메인 콘텐츠 영역 */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            ml: `${drawerWidth + contentMargin}px`,
            maxWidth: '1100px',
            width: 'calc(100% - 260px)',
            minWidth: '1100px',
            margin: '0',
          }}
        >
          <Toolbar />
          {children}
        </Box>
      </Box>
    </>
  );
}