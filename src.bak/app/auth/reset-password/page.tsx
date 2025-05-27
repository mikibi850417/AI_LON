"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Supabase 비밀번호 재설정 이메일 전송
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-callback`, // 사용자가 링크 클릭 후 이동할 페이지
    });
    if (error) {
      setError("비밀번호 재설정 이메일 전송 실패: " + error.message);
    } else {
      setMessage("비밀번호 재설정 이메일을 전송했습니다. 이메일을 확인해주세요.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black">
      <div className="bg-white shadow-lg rounded-lg p-8 w-96">
        <h2 className="text-2xl font-bold text-center mb-6">비밀번호 재설정</h2>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        {message && <p className="text-green-500 text-sm text-center mb-4">{message}</p>}

        <form onSubmit={handleResetPassword} className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="가입한 이메일을 입력하세요"
            className="w-full p-2 border border-gray-300 rounded mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            재설정 이메일 전송
          </button>
        </form>
      </div>
    </div>
  );
}