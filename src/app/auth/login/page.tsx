"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black">
        <div className="bg-white shadow-lg rounded-lg p-8 w-96 text-center">
          <h2 className="text-2xl font-bold mb-6">로그인 상태</h2>
          <p className="text-lg mb-4">계정: {userInfo.email}</p>
          <button
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 mb-4"
            onClick={handleLogout}
          >
            로그아웃
          </button>
          <button
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
            onClick={handleGoDashboard}
          >
            대시보드 이동
          </button>
        </div>
      </div>
    );
  }

  // 로그인되지 않은 경우 로그인 폼 렌더링
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black">
      <div className="bg-white shadow-lg rounded-lg p-8 w-96">
        <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        <input
          type="email"
          placeholder="이메일"
          className="w-full p-2 border border-gray-300 rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          className="w-full p-2 border border-gray-300 rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
        <button
          className="w-full bg-red-500 text-white py-2 rounded mt-2 hover:bg-red-600"
          onClick={handleGoogleLogin}
        >
          Google 로그인
        </button>
        <p className="text-center mt-4">
          계정이 없으신가요?{" "}
          <a href={`${authPath}/signup`} className="text-blue-500 hover:underline">
            회원가입
          </a>
        </p>
        <p className="text-center mt-2">
          비밀번호를 잊으셨나요?{" "}
          <a href={`${authPath}/reset-password`} className="text-blue-500 hover:underline">
            비밀번호 초기화
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;