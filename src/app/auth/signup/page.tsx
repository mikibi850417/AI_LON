"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const SignupPage = () => {
  const router = useRouter();
  // 환경 변수에서 authPath를 불러오며, 기본값은 "/auth"
  const authPath = process.env.NEXT_PUBLIC_AUTH_PATH || "/auth";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 패스워드가 최소 한 개의 특수문자와 숫자를 포함하는지 검증하는 함수
  const validatePassword = (password: string): boolean => {
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    const digitRegex = /\d/;
    return specialCharRegex.test(password) && digitRegex.test(password);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("비밀번호와 패스워드 확인이 일치하지 않습니다.");
      return;
    }

    if (!validatePassword(password)) {
      setError("비밀번호는 최소 한 개의 특수문자와 숫자를 포함해야 합니다.");
      return;
    }

    setLoading(true);

    // 회원가입 요청 (계정명은 이메일로만 사용)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError("회원가입 실패: " + signUpError.message);
    } else {
      // 회원가입 성공 후 온보딩 페이지로 이동
      // 경로는 환경 변수 authPath를 기반으로 하여 "/auth/onboarding"이 됩니다.
      router.push(`${authPath}/onboarding`);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black">
      <div className="bg-white shadow-lg rounded-lg p-8 w-96">
        <h2 className="text-2xl font-bold text-center mb-6">회원가입</h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleSignup}>
          <input
            type="email"
            placeholder="이메일 (계정명)"
            className="w-full p-2 border border-gray-300 rounded mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="비밀번호"
            className="w-full p-2 border border-gray-300 rounded mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="패스워드 확인"
            className="w-full p-2 border border-gray-300 rounded mb-4"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
            disabled={loading}
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;