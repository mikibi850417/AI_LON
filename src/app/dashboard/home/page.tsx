// src/app/dashboard/home/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import HotelPriceTable from "./HotelPriceTable";
import HotelPriceChart from "./HotelPriceChart";
// 기존 HotelPredictPrice 대신 공통 컴포넌트 사용
import HotelPredictPrice from "@/lib/components/HotelPredictPrice";
import TrendsTable from "./TrendsTable";
import EventWeatherTable from "@/app/dashboard/home/EventWeatherTable";
import SeasonalityTable from "@/app/dashboard/home/seasonalityTable";
import { supabase } from "@/lib/supabaseClient";
import { Box, CircularProgress } from "@mui/material";
import { format, addDays } from "date-fns";

const getApiBaseUrl = (): string => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function DashboardPage() {
  const [userId, setUserId] = useState<string>("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);
  const [dates, setDates] = useState<string[]>([]);
  const [userRegion, setUserRegion] = useState<{ location_code: string; region: string } | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        // 사용자 ID가 있으면 region 정보도 가져옵니다
        fetchUserRegion(session.user.id);
      }
    };
    fetchSession();
  }, []);

  // 사용자의 region 정보를 가져오는 함수
  const fetchUserRegion = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_address_info')
        .select('location_code, region') // location_code와 region 가져오기
        .eq('user_id', uid)
        .single();

      if (error) {
        console.error('사용자 지역 정보 조회 오류:', error);
        return;
      }

      if (data) {
        console.log('사용자 지역 정보:', data); // location_code와 region 출력
        setUserRegion(data); // location_code와 region 설정
      }
    } catch (err) {
      console.error('사용자 지역 정보 조회 중 예외 발생:', err);
    }
  };

  const getDateRange = (numDays: number) => {
    const today = new Date();
    return Array.from({ length: numDays }, (_, i) => format(addDays(today, i), "yyyy-MM-dd"));
  };

  const fetchPriceData = async () => {
    if (!userId) return;
    setLoading(true);
    const startDate = format(new Date(), "yyyy-MM-dd");
    const endDate = format(addDays(new Date(), days - 1), "yyyy-MM-dd");
    setDates(getDateRange(days));
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/competitor-hotels/price?user_id=${userId}&price_type=min&start_date=${startDate}&end_date=${endDate}`
      );
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("가격 데이터 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchPriceData();
  }, [userId, days]);

  // 특정 날짜에 대한 최저가 가져오는 함수
  const getPricesForDate = (date: string): number[] => {
    return data
      .filter((item) => item.date === date)
      .map((item) => parseFloat(item.min_price))
      .sort((a, b) => a - b);
  };

  return (
    <Box p={4} sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box
        mb={4}
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            background: 'white',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            width: 'fit-content'
          }}
        >
          {[7, 14, 21, 30].map((d) => (
            <Box
              key={d}
              onClick={() => setDays(d)}
              sx={{
                padding: '10px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                backgroundColor: d === days ? '#2c3e50' : 'transparent',
                color: d === days ? 'white' : '#64748b',
                '&:hover': {
                  backgroundColor: d === days ? '#2c3e50' : '#e8eaf6',
                }
              }}
            >
              {d}일
            </Box>
          ))}
        </Box>
      </Box>

      {loading && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}>
          <CircularProgress sx={{ color: '#2c3e50' }} />
        </Box>
      )}

      {!loading && (
        <>
          <HotelPriceTable data={data} dates={dates} />
          <HotelPriceChart data={data} dates={dates} />

          {/* 공통 HotelPredictPrice 컴포넌트 사용 */}
          <HotelPredictPrice
            dates={dates}
            userRegion={userRegion}
            getPricesForDate={getPricesForDate}
            title="예측된 호텔 가격"
          />

          <TrendsTable days={days} />
          <Box mt={3}>
            <SeasonalityTable userRegion={userRegion} />
          </Box>
          <EventWeatherTable locationCode={userRegion?.location_code} />
        </>
      )}
    </Box>
  );
}