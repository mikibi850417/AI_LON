"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Box, Paper, Grid, Typography } from "@mui/material";
import { LoggedInView } from "./components/LoggedInView";
import { LoginForm } from "./components/LoginForm";
import { VideoSection } from "./components/VideoSection";

const LoginPage = () => {
  const router = useRouter();

  const authPath = process.env.NEXT_PUBLIC_AUTH_PATH || "/auth";
  const dashboardPath = process.env.NEXT_PUBLIC_DASHBOARD_PATH || "/dashboard";
  const onboardingPath = `${authPath}/onboarding`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  interface UserInfo {
    id: string;
    email: string | undefined;
    is_subscribed: boolean;
    subscription_end_date: string | null;
  }
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [videoTab, setVideoTab] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // 구독 정보 포함하여 사용자 정보 가져오기
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('is_subscribed, subscription_end_date')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error('구독 정보 조회 실패:', userError);
        }

        setUserInfo({
          id: session.user.id,
          email: session.user.email || undefined,
          is_subscribed: userData?.is_subscribed || false,
          subscription_end_date: userData?.subscription_end_date || null
        });
      }
    };
    checkSession();
  }, []);

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

      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current session:", session);

      // 구독 정보 가져오기
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_subscribed, subscription_end_date')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.error('구독 정보 조회 실패:', userError);
      }

      setUserInfo({
        id: data.user.id,
        email: data.user.email || undefined,
        is_subscribed: userData?.is_subscribed || false,
        subscription_end_date: userData?.subscription_end_date || null
      });
    } catch (err) {
      console.error("Login process error:", err);
      setError("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      setError("구글 로그인 실패: " + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserInfo(null);
  };

  const handleGoDashboard = async () => {
    if (userInfo) {
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("is_initialized")
        .eq("id", userInfo.id)
        .maybeSingle();
      if (profileError || !profile) {
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
                로그인
              </Typography>
            </Box>
            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              error={error}
              loading={loading}
              handleLogin={handleLogin}
              handleGoogleLogin={handleGoogleLogin}
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