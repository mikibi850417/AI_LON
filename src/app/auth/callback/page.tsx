"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback 처리 시작');
        
        // URL 해시에서 토큰 추출 및 세션 설정
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/auth/login?error=auth_failed');
          return;
        }

        if (data.session?.user) {
          console.log('인증된 사용자:', data.session.user);
          
          // 사용자 정보 확인/생성
          let existingUser;
          let userError;
          
          try {
            const result = await supabase
              .from('users')
              .select('*')
              .eq('id', data.session.user.id)
              .maybeSingle();
            
            existingUser = result.data;
            userError = result.error;
          } catch (err) {
            console.error('사용자 조회 중 오류:', err);
            userError = err;
          }

          if (userError && typeof userError === 'object' && 'code' in userError && userError.code !== 'PGRST116') {
            console.error('User lookup error:', userError);
          }

          // 사용자가 존재하지 않으면 생성 시도
          if (!existingUser) {
            console.log('새 사용자 생성 시작');
            
            // 방법 1: 프론트엔드에서 직접 생성 시도
            let insertSuccess = false;
            let attempts = 0;
            const maxAttempts = 2;
            
            while (!insertSuccess && attempts < maxAttempts) {
              attempts++;
              
              try {
                const { error: insertError } = await supabase
                  .from('users')
                  .insert([
                    {
                      id: data.session.user.id,
                      email: data.session.user.email,
                      is_initialized: false,
                      is_subscribed: false
                    }
                  ]);

                if (!insertError) {
                  insertSuccess = true;
                  console.log('프론트엔드에서 사용자 생성 성공');
                } else {
                  console.error(`사용자 생성 시도 ${attempts} 실패:`, insertError);
                  
                  // 이미 존재하는 사용자라면 성공으로 처리
                  if (insertError && typeof insertError === 'object' && 'code' in insertError && insertError.code === '23505') {
                    insertSuccess = true;
                    console.log('사용자가 이미 존재함');
                  }
                }
              } catch (err) {
                console.error(`사용자 생성 시도 ${attempts} 중 오류:`, err);
              }
              
              if (!insertSuccess && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
            
            // 방법 2: 프론트엔드 생성이 실패했다면 백엔드 API 호출
            if (!insertSuccess) {
              console.log('백엔드 API를 통한 사용자 생성 시도');
              
              try {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ailon.iptime.org:8000';
                const response = await fetch(`${apiBaseUrl}/api/user/create-user`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.session.access_token}`
                  },
                  body: JSON.stringify({
                    user_id: data.session.user.id,
                    email: data.session.user.email
                  })
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('백엔드에서 사용자 생성 성공:', result);
                  insertSuccess = true;
                } else {
                  console.error('백엔드 사용자 생성 실패:', response.status, response.statusText);
                }
              } catch (backendError) {
                console.error('백엔드 API 호출 중 오류:', backendError);
              }
            }
            
            if (!insertSuccess) {
              console.error('모든 방법으로 사용자 생성에 실패했지만 로그인은 진행');
            }
          } else {
            console.log('기존 사용자 확인됨:', existingUser);
          }

          // 로그인 페이지로 리다이렉트 (로그인된 상태로 표시됨)
          console.log('로그인 페이지로 리다이렉트');
          router.push('/auth/login');
        } else {
          console.log('세션이 없음');
          router.push('/auth/login?error=no_session');
        }
      } catch (err) {
        console.error('Auth callback process error:', err);
        router.push('/auth/login?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: 2
    }}>
      <CircularProgress size={40} />
      <Typography variant="body1" color="text.secondary">
        로그인 처리 중...
      </Typography>
    </Box>
  );
}