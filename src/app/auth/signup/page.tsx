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
            placeholder="비밀번호 확인" // 플레이스홀더 변경
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
        {/* 선택 사항: 로그인 페이지로 돌아가는 링크 추가 */}
        <p className="text-center mt-4">
          이미 계정이 있으신가요?{" "}
          <a href={`${authPath}/login`} className="text-blue-500 hover:underline">
            로그인
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;