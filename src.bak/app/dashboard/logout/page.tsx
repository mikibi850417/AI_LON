"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut();
      router.push("/auth/login"); // 로그아웃 후 메인 페이지로 리다이렉트
    };
    logout();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 text-black">
      <p>로그아웃 중...</p>
    </div>
  );
}