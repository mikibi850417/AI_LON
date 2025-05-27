"use client";

import { ko } from 'date-fns/locale';
import { format, addDays } from 'date-fns';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
  alpha,
} from '@mui/material';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import {
  LineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { supabase } from '@/lib/supabaseClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// 여행지수 색상 및 텍스트 매핑 함수
const getScoreColor = (score: number): { color: string; text: string } => {
  if (score >= 80) return { color: '#4CAF50', text: '최고' };
  if (score >= 60) return { color: '#8BC34A', text: '좋음' };
  if (score >= 40) return { color: '#FFC107', text: '보통' };
  if (score >= 20) return { color: '#FF9800', text: '나쁨' };
  return { color: '#F44336', text: '매우나쁨' };
};

interface ChartDataPoint {
  date: string;
  dayOfWeek: string;
  isWeekend: boolean;
  score: number;
}

// 여행지수 계산 함수
const fetchTravelScore = async (date: string, region: string, address: string): Promise<number | null> => {
  try {
    const requestBody = {
      date,
      region,
      address // FastAPI expects 'address' field
    }; const url = `${API_BASE_URL}/api/price/seasonality`;

    // Supabase에서 세션 가져오기
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('인증 세션이 없습니다.');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`여행지수를 가져오는데 실패했습니다 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.travel_score;
  } catch (error) {
    console.error('여행지수 API 호출 오류:', error);
    return null;
  }
};

// 컴포넌트 props 타입 정의
interface SeasonalityTableProps {
  userRegion?: { region: string; location_code: string } | null;
  days?: number;
}

// 날짜 범위 생성 함수
const generateDateRange = (days: number) => {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i);
    return {
      date,
      formattedDate: format(date, 'yyyy-MM-dd'),
      displayDate: format(date, 'M/d'),
      dayOfWeek: format(date, 'EEE', { locale: ko }),
      isWeekend: [0, 6].includes(date.getDay())
    };
  });
};

// 스타일 정의
const tableStyles = {
  container: {
    maxHeight: 440,
    marginTop: 2,
    marginBottom: 2,
    '& .MuiTableCell-root': {
      padding: '8px 16px',
    },
  },
  header: {
    fontWeight: 'bold',
    backgroundColor: alpha('#000', 0.05),
  },
  content: {
    fontSize: '0.875rem',
  },
};

// 여행지수 컴포넌트
const SeasonalityTable = ({ userRegion, days = 14 }: SeasonalityTableProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [travelScores, setTravelScores] = useState<(number | null)[]>(Array(14).fill(null));
  const [dateRange, setDateRange] = useState(() => generateDateRange(days));
  const [lastUpdated, setLastUpdated] = useState<string>(format(new Date(), 'yyyy-MM-dd HH:mm:ss'));
  const [tabValue, setTabValue] = useState<number>(0);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    setDateRange(generateDateRange(days));
  }, [days]);

  // 여행지수 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      if (!userRegion) return;
      setLoading(true);

      try {
        const scores = await Promise.all(
          dateRange.map(async (dateInfo) => {
            return await fetchTravelScore(dateInfo.formattedDate, userRegion.region, userRegion.location_code);
          })
        );

        setTravelScores(scores);

        // 차트 데이터 생성
        const chartData = dateRange.map((dateInfo, index) => ({
          date: dateInfo.displayDate,
          dayOfWeek: dateInfo.dayOfWeek,
          isWeekend: dateInfo.isWeekend,
          score: scores[index] || 0
        }));

        setChartData(chartData);
      } catch (error) {
        console.error('여행지수 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
        setLastUpdated(format(new Date(), 'yyyy-MM-dd HH:mm:ss'));
      }
    };

    fetchData();
  }, [userRegion, dateRange]);

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 여행지수 표시 컴포넌트
  const TravelScoreIndicator = ({ score }: { score: number | null }) => {
    if (score === null) {
      return (
        <Typography variant="body2" color="text.secondary">
          정보 없음
        </Typography>
      );
    }

    const { color, text } = getScoreColor(score);

    return (
      <Tooltip title={`여행지수: ${score}점`}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: color,
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              mb: 0.5
            }}
          >
            {score}
          </Box>
          <Typography variant="caption" sx={{ color, fontWeight: 'medium' }}>
            {text}
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      background: 'white'
    }}>
      {/* 헤더 */}
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(90deg, #2c3e50 0%, #34495e 100%)',
          color: 'white'
        }}
      >
        <BeachAccessIcon sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          여행지수
        </Typography>
      </Box>

      {/* 로딩 상태 */}
      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ color: '#2c3e50' }} />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            여행지수 데이터를 불러오는 중입니다...
          </Typography>
        </Box>
      ) : (
        <Box sx={{ p: 3 }}>
          {/* 탭 */}
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              mb: 3,
              '& .MuiTabs-indicator': {
                backgroundColor: '#2c3e50',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                color: '#64748b',
                '&.Mui-selected': {
                  color: '#2c3e50',
                  fontWeight: 600,
                },
              },
            }}
          >
            <Tab
              icon={<CalendarViewDayIcon />}
              label="카드 보기"
              iconPosition="start"
            />
            <Tab
              icon={<ShowChartIcon />}
              label="그래프 보기"
              iconPosition="start"
            />
          </Tabs>

          {/* 캘린더 보기 탭 */}
          {tabValue === 0 && (
            <Box>
              <Box sx={{
                display: 'flex',
                gap: 1,
                overflowX: 'auto',
                pb: 2,
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha('#2c3e50', 0.2),
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: alpha('#2c3e50', 0.05),
                }
              }}>
                {dateRange.map((dateInfo, index) => (
                  <Paper
                    key={dateInfo.formattedDate}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      minWidth: days <= 7 ? `calc(100% / ${days} - ${days - 1}px)` : 80,
                      textAlign: 'center',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: index === 0 ? alpha('#2c3e50', 0.05) : 'transparent',
                      boxShadow: index === 0 ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontWeight: dateInfo.isWeekend ? 'bold' : 'normal',
                        color: dateInfo.isWeekend ? '#d32f2f' : 'text.secondary',
                      }}
                    >
                      {dateInfo.dayOfWeek}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'medium',
                        my: 0.5,
                        color: index === 0 ? '#2c3e50' : 'text.primary'
                      }}
                    >
                      {dateInfo.displayDate}
                    </Typography>

                    <Box sx={{ mt: 1 }}>
                      <TravelScoreIndicator score={travelScores[index]} />
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}

          {/* 그래프 보기 탭 */}
          {tabValue === 1 && (
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#666' }}
                    tickFormatter={(value, index) => {
                      const isWeekend = chartData[index]?.isWeekend;
                      return `${value}(${chartData[index]?.dayOfWeek})`;
                    }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#666' }}
                    tickFormatter={(value) => `${value}점`}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => [`${value}점`, '여행지수']}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  />
                  <Legend />
                  <ReferenceLine y={80} stroke="#4CAF50" strokeDasharray="3 3" label="최고" />
                  <ReferenceLine y={60} stroke="#8BC34A" strokeDasharray="3 3" label="좋음" />
                  <ReferenceLine y={40} stroke="#FFC107" strokeDasharray="3 3" label="보통" />
                  <ReferenceLine y={20} stroke="#FF9800" strokeDasharray="3 3" label="나쁨" />
                  <RechartsLine
                    type="monotone"
                    dataKey="score"
                    name={`여행지수`}
                    stroke="#2c3e50"
                    strokeWidth={2}
                    dot={{
                      fill: '#2c3e50',
                      r: 4,
                      strokeWidth: 2
                    }}
                    activeDot={{
                      r: 6,
                      fill: '#2c3e50',
                      stroke: 'white',
                      strokeWidth: 2
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Box>
      )}

      {/* 푸터 */}
      <Box sx={{
        p: 2,
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        textAlign: 'right',
        color: '#757575',
        fontSize: '0.8rem'
      }}>
        마지막 업데이트: {lastUpdated}
      </Box>
    </Box>
  );
};

export default SeasonalityTable;