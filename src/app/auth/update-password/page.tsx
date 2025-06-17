"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Box, TextField, Button, Typography, CircularProgress, Paper, Alert } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const UpdatePasswordPage = () => {
  // 환경 변수에서 authPath를 불러오며, 기본값은 "/auth"
  const authPath = process.env.NEXT_PUBLIC_AUTH_PATH || "/auth";
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 비밀번호 유효성 검사
  const validatePassword = () => {
    if (password.length < 8) {
      return "비밀번호는 최소 8자 이상이어야 합니다.";
    }
    if (password !== confirmPassword) {
      return "비밀번호가 일치하지 않습니다.";
    }
    return null;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // 비밀번호 유효성 검사
    const passwordError = validatePassword();
    if (passwordError) {
      setMessage({
        type: "error",
        text: passwordError
      });
      return;
    }

    setMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setMessage({
        type: "success",
        text: "비밀번호가 성공적으로 변경되었습니다."
      });

      // 비밀번호 변경 성공 후 3초 후에 로그인 페이지로 리디렉션
      setTimeout(() => {
        router.push(`${authPath}/login`);
      }, 3000);

    } catch (error: unknown) {
      setMessage({
        type: "error",
        text: `비밀번호 변경 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
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
            새 비밀번호 설정
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
            새로운 비밀번호를 입력해주세요. 비밀번호는 최소 8자 이상이어야 합니다.
          </Typography>

          <form onSubmit={handleUpdatePassword}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b', fontWeight: 'bold' }}>
                새 비밀번호
              </Typography>
              <TextField
                fullWidth
                type="password"
                placeholder="새 비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: <LockIcon sx={{ mr: 1, color: '#64748b' }} />,
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

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b', fontWeight: 'bold' }}>
                비밀번호 확인
              </Typography>
              <TextField
                fullWidth
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  startAdornment: <LockIcon sx={{ mr: 1, color: '#64748b' }} />,
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
                "비밀번호 변경하기"
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

export default UpdatePasswordPage; 