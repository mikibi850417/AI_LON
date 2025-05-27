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
import { Box, CircularProgress, Fab, Tooltip, Dialog, IconButton, Avatar } from "@mui/material";
import { format, addDays } from "date-fns";
import CloseIcon from '@mui/icons-material/Close';
import Image from "next/image";

const getApiBaseUrl = (): string => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function DashboardPage() {
  const [userId, setUserId] = useState<string>("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);
  const [dates, setDates] = useState<string[]>([]);
  const [userRegion, setUserRegion] = useState<{ location_code: string; region: string } | null>(null);
  const [openPredictDialog, setOpenPredictDialog] = useState(false);

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

  // 예측 다이얼로그 열기
  const handleOpenPredictDialog = () => {
    setOpenPredictDialog(true);
  };

  // 예측 다이얼로그 닫기
  const handleClosePredictDialog = () => {
    setOpenPredictDialog(false);
  };

  return (
    <Box p={4} sx={{ background: '#f5f7ff', minHeight: '100vh', position: 'relative' }}>
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

          <TrendsTable days={days} dates={dates} />
          <Box mt={3}>
            <SeasonalityTable userRegion={userRegion} days={days} />
          </Box>
          <EventWeatherTable locationCode={userRegion?.location_code} days={days} dates={dates} />
        </>
      )}

      {/* Floating Action Button */}
      <Tooltip
        title="AI 가격 예측"
        placement="left"
        componentsProps={{
          tooltip: {
            sx: {
              fontSize: '1.2rem',
              padding: '8px 12px',
              backgroundColor: 'rgba(44, 62, 80, 0.9)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              transform: 'translateY(-5px)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }
          }
        }}
      >
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            backgroundColor: '#2c3e50',
            backgroundImage: 'linear-gradient(135deg, #2c3e50 0%, #1a2530 100%)',
            '&:hover': {
              backgroundImage: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
              transform: 'scale(1.05) rotate(5deg)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3), 0 6px 12px rgba(44, 62, 80, 0.4)'
            },
            width: 128,
            height: 128,
            boxShadow: '0 6px 20px rgba(0,0,0,0.2), 0 3px 8px rgba(44, 62, 80, 0.3)',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(44, 62, 80, 0.7)' },
              '70%': { boxShadow: '0 0 0 15px rgba(44, 62, 80, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(44, 62, 80, 0)' }
            }
          }}
          onClick={handleOpenPredictDialog}
        >
          <Avatar
            sx={{
              width: 120,
              height: 120,
              backgroundColor: 'transparent',
              animation: 'float 3s ease-in-out infinite',
              '@keyframes float': {
                '0%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-10px)' },
                '100%': { transform: 'translateY(0px)' }
              }
            }}
          >
            <Image
              src="/webicon.png"
              alt="예측 아이콘"
              width={120}
              height={120}
              style={{
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                transition: 'all 0.3s ease'
              }}
            />
          </Avatar>
        </Fab>
      </Tooltip>

      {/* 예측된 호텔 가격 다이얼로그 */}
      <Dialog
        open={openPredictDialog}
        onClose={handleClosePredictDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            padding: { xs: '16px', sm: '24px' },
            position: 'relative',
            backgroundColor: '#f8fafc',
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15), 0 15px 25px rgba(49, 130, 206, 0.1)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            overflow: 'hidden',
            maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
            margin: { xs: '16px', sm: '32px' },
            width: { xs: 'calc(100% - 32px)', sm: 'auto' }
          }
        }}
      >
        <IconButton
          onClick={handleClosePredictDialog}
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 16 },
            top: { xs: 8, sm: 16 },
            color: '#64748b',
            backgroundColor: 'rgba(226, 232, 240, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(226, 232, 240, 0.8)',
              color: '#2c3e50'
            },
            zIndex: 10
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{
          mt: { xs: 1, sm: 2 },
          mb: { xs: 2, sm: 4 },
          overflowY: 'auto',
          maxHeight: { xs: 'calc(100vh - 120px)', sm: 'calc(100vh - 180px)' },
          '&::-webkit-scrollbar': {
            display: 'none'  // 웹킷 기반 브라우저에서 스크롤바 숨김
          },
          scrollbarWidth: 'none',  // Firefox에서 스크롤바 숨김
          msOverflowStyle: 'none',  // IE에서 스크롤바 숨김
        }}>
          <HotelPredictPrice
            dates={dates}
            userRegion={userRegion}
            getPricesForDate={getPricesForDate}
            title="L.O.N Price Insight"
          />
        </Box>
      </Dialog>
    </Box>
  );
}