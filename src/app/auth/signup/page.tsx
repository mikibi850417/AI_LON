"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Box, TextField, Button, Typography, CircularProgress, Divider, Paper } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import Link from 'next/link';

const SignupPage = () => {
  // 환경 변수에서 authPath를 불러오며, 기본값은 "/auth"
  const authPath = process.env.NEXT_PUBLIC_AUTH_PATH || "/auth";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // 비밀번호 확인 상태
  const [error, setError] = useState(""); // 오류 메시지 상태
  const [loading, setLoading] = useState(false); // 로딩 상태

  // 비밀번호가 최소 한 개의 특수문자와 숫자를 포함하는지 검증하는 함수
  const validatePassword = (password: string): boolean => {
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/; // 특수문자 정규식
    const digitRegex = /\d/; // 숫자 정규식
    return specialCharRegex.test(password) && digitRegex.test(password);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // 오류 메시지 초기화

    if (password !== confirmPassword) {
      setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    if (!validatePassword(password)) {
      setError("비밀번호는 최소 한 개의 특수문자와 숫자를 포함해야 합니다.");
      return;
    }

    setLoading(true); // 로딩 시작

    // 회원가입 요청
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      // 선택 사항: 필요한 경우 이메일 리디렉션 URL 등 옵션 추가
      // options: {
      //   emailRedirectTo: `${window.location.origin}/auth/callback`,
      // }
    });

    setLoading(false); // 로딩 종료

    if (signUpError) {
      console.error("Supabase 회원가입 오류:", signUpError); // 디버깅을 위해 실제 오류 로그 출력
      // 오류 메시지가 사용자가 이미 존재함을 나타내는지 확인
      // Supabase는 다른 메시지나 코드를 사용할 수 있으므로 콘솔 로그를 기반으로 조정 필요
      if (signUpError.message.includes("User already registered") || signUpError.message.includes("already exists")) {
        setError("이미 가입된 이메일 주소입니다. 로그인을 시도하거나 비밀번호를 재설정하세요.");
      } else {
        // 다른 오류에 대해서는 기본 Supabase 오류 메시지 사용
        setError("회원가입 실패: " + signUpError.message);
      }
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
      // 이 조건은 확인 이메일이 재전송된 기존 사용자를 나타낼 수 있음
      // Supabase 동작은 다를 수 있음; 특정 사례에서 data 객체 구조 확인 필요
      setError("이미 가입된 이메일 주소입니다. 확인 이메일이 다시 발송되었을 수 있습니다. 받은편지함을 확인해주세요.");
      // 작업(이메일 재전송)이 완료되었으므로 폼 초기화
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      alert("이미 가입된 이메일 주소입니다. 확인 이메일을 확인해주세요."); // 즉각적인 피드백을 위한 알림
    } else if (data.user) {
      // 신규 사용자 회원가입 성공 (또는 이메일 확인 필요)
      alert("회원가입 요청 성공! 이메일을 확인하여 계정을 활성화해주세요.");
      // 폼 초기화
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      // 선택 사항: "이메일 확인" 페이지 또는 로그인 페이지로 리디렉션
      // router.push(`${authPath}/login`);
    } else {
      // 예기치 않은 시나리오에 대한 포괄적 처리
      setError("알 수 없는 오류가 발생했습니다. 다시 시도해주세요.");
      console.error("예상치 못한 회원가입 응답:", data); // 예상치 못한 데이터 로그 출력
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
            회원가입
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

          <form onSubmit={handleSignup}>
            <Box sx={{ mb: 3 }}>
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

            <Box sx={{ mb: 3 }}>
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
                background: 'linear-gradient(90deg, #27ae60, #2ecc71)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #219a52, #27ae60)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 12px rgba(39, 174, 96, 0.3)'
                },
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(39, 174, 96, 0.2)',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                "회원가입"
              )}
            </Button>
          </form>

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

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              이미 계정이 있으신가요?{" "}
              <Typography
                component={Link}
                href={`${authPath}/login`}
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
                로그인
              </Typography>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default SignupPage;