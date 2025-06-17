// hooks/useAuth.ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/auth-helpers-nextjs";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 초기 세션 확인
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (!session) {
        router.push("/");
      }
    };
    getSession();

    // 세션 변화 리스너 등록
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        router.push("/");
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  return session;
}