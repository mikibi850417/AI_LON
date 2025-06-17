"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Box, TextField, Button, Typography, CircularProgress, Paper, Alert } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from 'next/link';

const ResetPasswordPage = () => {
  // 환경 변수에서 authPath를 불러오며, 기본값은 "/auth"
  const authPath = process.env.NEXT_PUBLIC_AUTH_PATH || "/auth";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 세션 확인 및 URL 파라미터 처리 추가
  useEffect(() => {
    const handleAuthStateChange = async () => {
      // URL에서 access_token과 refresh_token 확인
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        // 토큰이 있으면 세션 설정
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error('세션 설정 실패:', error);
          setMessage({
            type: "error",
            text: "인증 토큰 처리 중 오류가 발생했습니다."
          });
        } else {
          // 성공적으로 세션이 설정되면 update-password 페이지로 리디렉션
          window.location.href = `${authPath}/update-password`;
        }
      }
    };

    handleAuthStateChange();
  }, [authPath]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${authPath}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setMessage({
        type: "success",
        text: "비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요."
      });
      setEmail("");
    } catch (error: unknown) {
      setMessage({
        type: "error",
        text: `비밀번호 재설정 요청 실패: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'white',
      padding: '24px',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url("/pattern.png")',
        opacity: 0.05,
        zIndex: 0
      }
    }}>
      <Paper elevation={10} sx={{
        width: '100%',
        maxWidth: '450px',
        borderRadius: '16px',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        background: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        transform: 'translateZ(0)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px) translateZ(0)',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)'
        }
      }}>
        <Box sx={{
          p: 3,
          background: 'linear-gradient(90deg, #2c3e50, #4a6572)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'url("/pattern.png")',
            opacity: 0.1,
            zIndex: 0
          }
        }}>
          <Image
            src="/intelligentlon.png"
            alt="Company Logo"
            width={200}
            height={70}
            style={{
              objectFit: 'contain',
              marginBottom: '16px',
              position: 'relative',
              zIndex: 1,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}
          />
          <Typography variant="h5" sx={{
            color: 'white',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            position: 'relative',
            zIndex: 1
          }}>
            비밀번호 재설정
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          {message && (
            <Alert
              severity={message.type}
              sx={{
                mb: 3,
                borderRadius: '12px',
                animation: message.type === 'error' ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { boxShadow: '0 0 0 0 rgba(231, 76, 60, 0.4)' },
                  '70%': { boxShadow: '0 0 0 10px rgba(231, 76, 60, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(231, 76, 60, 0)' }
                }
              }}
            >
              {message.text}
            </Alert>
          )}

          <Typography variant="body1" sx={{ mb: 3, color: '#64748b' }}>
            가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
          </Typography>

          <form onSubmit={handleResetPassword}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b', fontWeight: 'bold' }}>
                이메일
              </Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="이메일 주소를 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: '#64748b' }} />,
                }}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': {
                      borderColor: '#2c3e50',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2c3e50',
                      borderWidth: '2px'
                    },
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }
                  }
                }}
              />
            </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                mb: 2,
                py: 1.5,
                background: 'linear-gradient(90deg, #2c3e50, #4a6572)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #1a2a3a, #3a5562)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 12px rgba(44, 62, 80, 0.3)'
                },
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(44, 62, 80, 0.2)',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                "비밀번호 재설정 링크 받기"
              )}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              component={Link}
              href={`${authPath}/login`}
              startIcon={<ArrowBackIcon />}
              sx={{
                py: 1.5,
                borderColor: '#64748b',
                color: '#64748b',
                '&:hover': {
                  backgroundColor: 'rgba(100, 116, 139, 0.05)',
                  borderColor: '#475569',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(100, 116, 139, 0.2)'
                },
                borderRadius: '12px',
                fontWeight: 'medium',
                borderWidth: '2px',
                transition: 'all 0.3s ease'
              }}
            >
              로그인 페이지로 돌아가기
            </Button>
          </form>
        </Box>
      </Paper>
    </Box>
  );
};

export default ResetPasswordPage;