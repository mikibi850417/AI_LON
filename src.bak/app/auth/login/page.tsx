"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Box, TextField, Button, Typography, CircularProgress, Divider, Paper, Grid } from "@mui/material";
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
        background: 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)',
        padding: '24px'
      }}>
        <Paper elevation={10} sx={{
          width: '100%',
          maxWidth: '450px',
          borderRadius: '16px',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
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
              style={{ objectFit: 'contain', marginBottom: '16px', position: 'relative', zIndex: 1 }}
            />
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)', position: 'relative', zIndex: 1 }}>
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
              borderRadius: '12px',
              border: '1px solid rgba(44, 62, 80, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transform: 'translateY(-2px)'
              }
            }}>
              <PersonIcon sx={{ color: '#2c3e50', mr: 2, fontSize: 28 }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 'bold' }}>
                  로그인 계정
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#2c3e50', fontSize: '1.1rem' }}>
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
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(231, 76, 60, 0.2)'
                },
                borderRadius: '12px',
                fontWeight: 'medium',
                borderWidth: '2px',
                transition: 'all 0.3s ease'
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
      background: 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)',
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
      <Grid container spacing={4} sx={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <Grid item xs={12} md={6} sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          transform: 'perspective(1000px) rotateY(0deg)',
          transition: 'all 0.5s ease'
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
                로그인
              </Typography>
            </Box>

            <Box sx={{ p: 4 }}>
              {error && (
                <Box sx={{
                  p: 2,
                  mb: 3,
                  backgroundColor: 'rgba(231, 76, 60, 0.1)',
                  borderRadius: '12px',
                  borderLeft: '4px solid #e74c3c',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(231, 76, 60, 0.4)' },
                    '70%': { boxShadow: '0 0 0 10px rgba(231, 76, 60, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(231, 76, 60, 0)' }
                  }
                }}>
                  <Typography variant="body2" sx={{ color: '#e74c3c' }}>
                    {error}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b', fontWeight: 'bold' }}>
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
                variant="contained"
                startIcon={<LoginIcon />}
                onClick={handleLogin}
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
                  "로그인"
                )}
              </Button>

              <Button
                fullWidth
                variant="contained"
                component={Link}
                href={`${authPath}/signup`}
                sx={{
                  mb: 2,
                  py: 1.5,
                  background: 'linear-gradient(90deg, #27ae60, #2ecc71)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #219a52, #27ae60)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 12px rgba(39, 174, 96, 0.3)'
                  },
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(39, 174, 96, 0.2)',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                회원가입
              </Button>

              <Divider sx={{ 
                my: 3,
                '&::before, &::after': {
                  borderColor: 'rgba(44, 62, 80, 0.2)'
                }
              }}>
                <Typography variant="body2" sx={{ 
                  color: '#64748b',
                  px: 1,
                  py: 0.5,
                  borderRadius: '4px',
                  backgroundColor: 'rgba(44, 62, 80, 0.05)'
                }}>
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
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(231, 76, 60, 0.2)'
                  },
                  borderRadius: '12px',
                  fontWeight: 'medium',
                  borderWidth: '2px',
                  transition: 'all 0.3s ease'
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
                      position: 'relative',
                      '&:hover': {
                        color: '#4a6572'
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        width: '100%',
                        height: '2px',
                        bottom: -2,
                        left: 0,
                        backgroundColor: '#2c3e50',
                        transform: 'scaleX(0)',
                        transformOrigin: 'bottom right',
                        transition: 'transform 0.3s ease'
                      },
                      '&:hover::after': {
                        transform: 'scaleX(1)',
                        transformOrigin: 'bottom left'
                      }
                    }}
                  >
                    비밀번호 초기화
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          transform: 'perspective(1000px) rotateY(0deg)',
          transition: 'all 0.5s ease'
        }}>
          <Box sx={{ 
            width: '100%', 
            height: '550px',
            borderRadius: '16px', 
            overflow: 'hidden',
            boxShadow: '0 15px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            transform: 'translateZ(0)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px) translateZ(0)',
              boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.3)'
            },
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.2) 100%)',
              zIndex: 1,
              pointerEvents: 'none'
            }
          }}>
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/FHUEOLGhRrw?autoplay=1&mute=1&loop=1&playlist=FHUEOLGhRrw"
              title="회사 소개 영상"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'relative', zIndex: 0 }}
            ></iframe>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginPage;