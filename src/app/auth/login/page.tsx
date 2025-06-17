"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Box, Paper, Grid, Typography } from "@mui/material";
import { LoggedInView } from "./components/LoggedInView";
import { LoginForm } from "./components/LoginForm";
import { VideoSection } from "./components/VideoSection";

interface UserInfo {
  id: string;
  email: string | undefined;
  is_subscribed: boolean;
  subscription_end_date: string | null;
}

const LoginPage = () => {
  const router = useRouter();

  const authPath = process.env.NEXT_PUBLIC_AUTH_PATH || "/auth";
  const dashboardPath = process.env.NEXT_PUBLIC_DASHBOARD_PATH || "/dashboard";
  const onboardingPath = `${authPath}/onboarding`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [videoTab, setVideoTab] = useState(0);

  // 구독 상태 확인 로직을 별도 함수로 분리
  const checkUserSubscription = useCallback(async (userId: string, userEmail?: string) => {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_subscribed, subscription_end_date')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('사용자 정보 조회 실패:', userError);
      return null;
    }

    const now = new Date();
    const subscriptionEndDate = userData?.subscription_end_date
      ? new Date(userData.subscription_end_date)
      : null;

    const isSubscribed = Boolean(userData?.is_subscribed &&
      subscriptionEndDate &&
      subscriptionEndDate > now);

    return {
      id: userId,
      email: userEmail,
      is_subscribed: isSubscribed,
      subscription_end_date: userData?.subscription_end_date || null
    };
  }, []);

  const checkSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const userInfo = await checkUserSubscription(session.user.id, session.user.email || undefined);
      if (userInfo) {
        setUserInfo(userInfo);
      }
    }
  }, [checkUserSubscription]);

  useEffect(() => {
    // URL 해시에서 이메일 확인 처리
    const handleEmailConfirmation = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        checkSession();
      }
    };

    // 페이지 로드 시 세션 확인
    checkSession();

    // 이메일 확인 링크로 돌아온 경우 처리
    if (window.location.hash.includes('access_token')) {
      handleEmailConfirmation();
    }

    // auth state 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          checkSession();
        } else if (event === 'SIGNED_OUT') {
          setUserInfo(null);
        }
      }
    );

    // 페이지 포커스 시 구독 상태 재확인 (결제 완료 후 돌아올 때)
    const handleVisibilityChange = () => {
      if (!document.hidden && userInfo) {
        checkSession();
      }
    };

    const handleFocus = () => {
      if (userInfo) {
        checkSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkSession, userInfo]); // Fixed dependencies

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Login error:", error);
        setError("로그인 실패: " + error.message);
        return;
      }

      if (!data.user) {
        setError("로그인 실패: 사용자 정보를 가져올 수 없습니다.");
        return;
      }

      // 중복 제거: checkSession이 auth state change에서 자동으로 호출됨
    } catch (err) {
      console.error("Login process error:", err);
      setError("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError("");
    setLoading(true);

    // 비밀번호 확인 검증
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        console.error("SignUp error:", error);
        setError("회원가입 실패: " + error.message);
        return;
      }

      if (data.user) {
        // 회원가입 성공 시 users 테이블에 기본 정보 추가
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              is_initialized: false
            }
          ]);

        if (insertError) {
          console.error('사용자 정보 저장 실패:', insertError);
        }

        setError("회원가입이 완료되었습니다. 이메일을 확인해주세요.");
        setIsSignUp(false); // 로그인 모드로 전환
      }
    } catch (err) {
      console.error("SignUp process error:", err);
      setError("회원가입 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error("Google auth error:", error);
        setError("구글 인증 실패: " + error.message);
      }
    } catch (err) {
      console.error("Google auth process error:", err);
      setError("구글 인증 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserInfo(null);
  };

  const handleGoDashboard = async () => {
    console.log("handleGoDashboard 함수 호출됨");

    if (userInfo) {
      console.log("UserInfo:", userInfo);

      // 현재 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("Current session:", session);
      console.log("Session error:", sessionError);

      // 쿠키 확인
      const cookies = document.cookie;
      console.log("Browser cookies:", cookies);

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("is_initialized")
        .eq("id", userInfo.id)
        .maybeSingle();

      console.log("Profile data:", profile);
      console.log("Profile error:", profileError);

      if (profileError || !profile) {
        console.log("Redirecting to onboarding due to profile error or missing profile");
        router.push(onboardingPath);
        return;
      }

      // 구독이 활성화되어 있고 초기화가 안된 경우 온보딩으로
      if (userInfo.is_subscribed && !profile.is_initialized) {
        console.log("Redirecting to onboarding - subscribed but not initialized");
        router.push(onboardingPath);
      } else if (profile.is_initialized) {
        console.log("Redirecting to dashboard - profile is initialized");
        router.push(dashboardPath);
      } else {
        // 구독하지 않았고 초기화도 안된 경우는 현재 페이지에 머물러서 구독 유도
        console.log("Staying on current page - not subscribed and not initialized");
        return;
      }
    } else {
      console.log("No userInfo available");
    }
  };

  const handleVideoTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setVideoTab(newValue);
  };

  const videos = [
    {
      id: "FHUEOLGhRrw",
      title: "회사 소개 영상"
    },
    {
      id: "fe3hNqUWDyE",
      title: "제품 소개 영상"
    },
    {
      id: "MfZd0KZZXMU",
      title: "서비스 안내 영상"
    }
  ];

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  if (userInfo) {
    return (
      <LoggedInView
        userInfo={userInfo}
        authPath={authPath}
        handleGoDashboard={handleGoDashboard}
        handleLogout={handleLogout}
      />
    );
  }

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
                {isSignUp ? '회원가입' : '로그인'}
              </Typography>
            </Box>
            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              error={error}
              loading={loading}
              isSignUp={isSignUp}
              handleLogin={handleLogin}
              handleSignUp={handleSignUp}
              handleGoogleAuth={handleGoogleAuth}
              toggleAuthMode={toggleAuthMode}
              authPath={authPath}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transform: 'perspective(1000px) rotateY(0deg)',
          transition: 'all 0.5s ease'
        }}>
          <VideoSection
            videoTab={videoTab}
            handleVideoTabChange={handleVideoTabChange}
            videos={videos}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginPage;