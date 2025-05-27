"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Box, Typography, CircularProgress, Paper, Alert } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('결제 확인 중입니다...');

  useEffect(() => {
    const recordPayment = async () => {
      try {
        const oid = params.get("P_OID");
        const resultCode = params.get("P_STATUS");

        if (!oid || resultCode !== "00") {
          setStatus('error');
          setMessage('결제 실패 또는 정보 누락');
          setTimeout(() => router.push("/auth/login"), 3000);
          return;
        }

        // 현재 로그인한 사용자 정보 가져오기
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user_id = session?.user?.id;

        if (!user_id) {
          setStatus('error');
          setMessage('사용자 인증 정보를 찾을 수 없습니다.');
          setTimeout(() => router.push("/auth/login"), 3000);
          return;
        }

        // 결제 성공 → Supabase DB에 기록
        const { data, error } = await supabase.from("payments").insert([
          {
            user_id,
            order_id: oid,
            status: "paid",
            paid_at: new Date().toISOString(),
          },
        ]);

        if (error) {
          console.error("DB 저장 실패:", error);
          setStatus('error');
          setMessage('결제 정보 저장 중 오류가 발생했습니다.');
          return;
        }

        // 결제 성공 처리
        setStatus('success');
        setMessage('결제가 성공적으로 완료되었습니다!');
        
        // 3초 후 대시보드로 이동
        setTimeout(() => router.push("/dashboard"), 3000);
      } catch (err) {
        console.error("결제 처리 오류:", err);
        setStatus('error');
        setMessage('결제 처리 중 오류가 발생했습니다.');
      }
    };

    recordPayment();
  }, [params, router]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '24px'
    }}>
      <Paper elevation={3} sx={{ 
        width: '100%', 
        maxWidth: '500px', 
        borderRadius: '16px',
        p: 4,
        textAlign: 'center'
      }}>
        {status === 'loading' && (
          <>
            <CircularProgress size={60} sx={{ mb: 3, color: '#3498db' }} />
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
              {message}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              잠시만 기다려주세요. 결제 정보를 확인하고 있습니다.
            </Typography>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircleIcon sx={{ fontSize: 80, color: '#27ae60', mb: 3 }} />
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
              {message}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              잠시 후 대시보드로 이동합니다.
            </Typography>
            <Alert severity="success">
              결제 정보가 성공적으로 저장되었습니다.
            </Alert>
          </>
        )}
        
        {status === 'error' && (
          <>
            <Alert severity="error" sx={{ mb: 3 }}>
              {message}
            </Alert>
            <Typography variant="body1" color="text.secondary">
              문제가 지속되면 고객센터로 문의해주세요.
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}
