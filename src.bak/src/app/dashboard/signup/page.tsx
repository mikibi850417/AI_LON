'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);

    // 1️⃣ Supabase Auth에 회원가입
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      console.error('회원가입 실패:', signUpError.message);
      setLoading(false);
      return;
    }

    const userId = signUpData.user?.id;
    const userEmail = signUpData.user?.email;

    if (!userId || !userEmail) {
      console.error('회원 정보 없음');
      setLoading(false);
      return;
    }

    // 2️⃣ hotelAddress → GPS 변환 (추후 Google API 연동)
    const latitude = 37.5665; // 예시값
    const longitude = 126.9780; // 예시값

    // 3️⃣ users 테이블에 추가 정보 저장
    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      email: userEmail,
      provider: 'email',
      hotel_name: hotelName,
      hotel_address: hotelAddress,
      hotel_latitude: latitude,
      hotel_longitude: longitude,
    });

    if (insertError) {
      console.error('회원 정보 저장 실패:', insertError.message);
    } else {
      console.log('회원가입 성공!');
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4">회원가입</h1>
      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 mb-2"
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 mb-2"
      />
      <input
        type="text"
        placeholder="호텔 이름"
        value={hotelName}
        onChange={(e) => setHotelName(e.target.value)}
        className="border p-2 mb-2"
      />
      <input
        type="text"
        placeholder="호텔 주소"
        value={hotelAddress}
        onChange={(e) => setHotelAddress(e.target.value)}
        className="border p-2 mb-4"
      />
      <button
        onClick={handleSignUp}
        className="px-4 py-2 bg-blue-500 text-white rounded"
        disabled={loading}
      >
        {loading ? '회원가입 중...' : '회원가입'}
      </button>
    </div>
  );
}
