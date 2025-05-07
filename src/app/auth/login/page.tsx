"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Box, TextField, Button, Typography, CircularProgress, Divider, Paper } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import LoginIcon from "@mui/icons-material/Login";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
// Import Link from next/link for navigation
import Link from 'next/link';


const LoginPage = () => {
  const router = useRouter();

  // 환경 변수에서 auth와 dashboard 경로 불러오기
  const authPath = process.env.NEXT_PUBLIC_AUTH_PATH || "/auth";
  const dashboardPath = process.env.NEXT_PUBLIC_DASHBOARD_PATH || "/dashboard";
  // onboardingPath는 authPath 기반으로 "/auth/onboarding"으로 구성
  const onboardingPath = `${authPath}/onboarding`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // 로그인한 사용자 정보를 저장하는 state
  const [userInfo, setUserInfo] = useState<any>(null);

  // 컴포넌트 마운트 시 세션 확인
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setUserInfo(session.user);
      }
    };
    checkSession();
  }, []);

  // 이메일/비밀번호 로그인 처리
  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError("로그인 실패: " + error.message);
      return;
    }
    if (!data.user) {
      setError("로그인 실패: 사용자 정보를 가져올 수 없습니다.");
      return;
    }
    setUserInfo(data.user);
  };

  // Google OAuth 로그인 처리
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      setError("구글 로그인 실패: " + error.message);
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserInfo(null);
  };

  // 대시보드 이동 버튼 클릭 시: 사용자의 초기화 여부 확인 후 리다이렉트
  const handleGoDashboard = async () => {
    if (userInfo) {
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("is_initialized")
        .eq("id", userInfo.id)
        .maybeSingle();
      if (profileError || !profile) {
        // 프로필 조회에 오류가 있거나 프로필이 없으면 온보딩으로 이동
        router.push(onboardingPath);
        return;
      }
      if (profile.is_initialized) {
        router.push(dashboardPath);
      } else {
        router.push(onboardingPath);
      }
    }
  };

  // 로그인된 사용자가 있다면 계정 정보와 함께 대시보드 이동 및 로그아웃 버튼을 표시
  if (userInfo) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '24px'
      }}>
        <Paper elevation={10} sx={{
          width: '100%',
          maxWidth: '450px',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          <Box sx={{
            p: 3,
            backgroundColor: '#2c3e50',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Image
              src="/intelligentlon.png"
              alt="Company Logo"
              width={200}
              height={70}
              style={{ objectFit: 'contain', marginBottom: '16px' }}
            />
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
              로그인 상태
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 4,
              p: 2,
              backgroundColor: 'rgba(44, 62, 80, 0.05)',
              borderRadius: '8px'
            }}>
              <PersonIcon sx={{ color: '#2c3e50', mr: 2 }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  로그인 계정
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#2c3e50' }}>
                  {userInfo.email}
                </Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              startIcon={<DashboardIcon />}
              onClick={handleGoDashboard}
              sx={{
                mb: 2,
                py: 1.5,
                backgroundColor: '#2c3e50',
                '&:hover': {
                  backgroundColor: '#34495e',
                },
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(44, 62, 80, 0.2)',
                fontWeight: 'bold'
              }}
            >
              대시보드 이동
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                py: 1.5,
                borderColor: '#e74c3c',
                color: '#e74c3c',
                '&:hover': {
                  backgroundColor: 'rgba(231, 76, 60, 0.05)',
                  borderColor: '#c0392b',
                },
                borderRadius: '8px',
                fontWeight: 'medium'
              }}
            >
              로그아웃
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // 로그인되지 않은 경우 로그인 폼 렌더링
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '24px'
    }}>
      <Paper elevation={10} sx={{
        width: '100%',
        maxWidth: '450px',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <Box sx={{
          p: 3,
          backgroundColor: '#2c3e50',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Image
            src="/intelligentlon.png"
            alt="Company Logo"
            width={200}
            height={70}
            style={{ objectFit: 'contain', marginBottom: '16px' }}
          />
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
            로그인
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          {error && (
            <Box sx={{
              p: 2,
              mb: 3,
              backgroundColor: 'rgba(231, 76, 60, 0.1)',
              borderRadius: '8px',
              borderLeft: '4px solid #e74c3c'
            }}>
              <Typography variant="body2" sx={{ color: '#e74c3c' }}>
                {error}
              </Typography>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b', fontWeight: 'medium' }}>
              이메일
            </Typography>
            <TextField
              fullWidth
              placeholder="이메일 주소를 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: <PersonIcon sx={{ mr: 1, color: '#64748b' }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&:hover fieldset': {
                    borderColor: '#2c3e50',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2c3e50',
                  },
                }
              }}
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b', fontWeight: 'medium' }}>
              비밀번호
            </Typography>
            <TextField
              fullWidth
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: '#64748b' }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&:hover fieldset': {
                    borderColor: '#2c3e50',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2c3e50',
                  },
                }
              }}
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            startIcon={<LoginIcon />}
            onClick={handleLogin}
            disabled={loading}
            sx={{
              mb: 2,
              py: 1.5,
              backgroundColor: '#2c3e50',
              '&:hover': {
                backgroundColor: '#34495e',
              },
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(44, 62, 80, 0.2)',
              fontWeight: 'bold'
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              "로그인"
            )}
          </Button>

          {/* 회원가입 버튼: Link 컴포넌트를 사용하여 signup 페이지로 이동 */}
          <Button
            fullWidth
            variant="contained"
            component={Link} // Use Link component for navigation
            href={`${authPath}/signup`} // Navigate to the signup page
            sx={{
              mb: 2,
              py: 1.5,
              backgroundColor: '#27ae60', // 스타일 유지
              '&:hover': {
                backgroundColor: '#2ecc71',
              },
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(39, 174, 96, 0.2)',
              fontWeight: 'bold',
              textTransform: 'none' // Prevent uppercase text from Link component
            }}
          >
            회원가입
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              또는
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{
              py: 1.5,
              borderColor: '#e74c3c',
              color: '#e74c3c',
              '&:hover': {
                backgroundColor: 'rgba(231, 76, 60, 0.05)',
                borderColor: '#c0392b',
              },
              borderRadius: '8px',
              fontWeight: 'medium'
            }}
          >
            Google 계정으로 로그인
          </Button>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              비밀번호를 잊으셨나요?{" "}
              <Typography
                component="a"
                href={`${authPath}/reset-password`}
                variant="body2"
                sx={{
                  color: '#2c3e50',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                비밀번호 초기화
              </Typography>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;