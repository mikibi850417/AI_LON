"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Tooltip,
  Paper,
  alpha,
  Tabs,
  Tab
} from '@mui/material';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// API 기본 URL 정의
const API_BASE_URL = "http://ailon.iptime.org:8000/api";

// 여행지수 점수에 따른 색상 및 텍스트 반환 함수
const getScoreColor = (score: number) => {
  if (score >= 80) return { color: '#4CAF50', text: '최고' }; // 녹색
  if (score >= 60) return { color: '#8BC34A', text: '좋음' }; // 연한 녹색
  if (score >= 40) return { color: '#FFC107', text: '보통' }; // 노란색
  if (score >= 20) return { color: '#FF9800', text: '나쁨' }; // 주황색
  return { color: '#F44336', text: '최악' }; // 빨간색
};

// 여행지수 API 호출 함수
const fetchTravelScore = async (date: string, region: string, address: string) => {
  try {
    const requestBody = {
      date,
      region,
      address
    };

    const url = `${API_BASE_URL}/price/seasonality`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

// 날짜 범위 생성 함수 (오늘부터 2주)
const generateDateRange = () => {
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
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

// 여행지수 시각화 컴포넌트
const TravelScoreIndicator = ({ score }: { score: number | null }) => {
  if (score === null) {
    return (
      <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="caption">데이터 없음</Typography>
      </Box>
    );
  }

  const { color, text } = getScoreColor(score);

  return (
    <Tooltip title={`여행지수: ${score}점 (${text})`} arrow>
      <Box sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.875rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          {score}
        </Box>
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
          {text}
        </Typography>
      </Box>
    </Tooltip>
  );
};

// 컴포넌트 props 타입 정의
interface SeasonalityTableProps {
  userRegion?: { region: string; location_code: string } | null;
}

// 여행지수 컴포넌트
const SeasonalityTable = ({ userRegion }: SeasonalityTableProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [travelScores, setTravelScores] = useState<(number | null)[]>(Array(14).fill(null));
  const [dateRange, setDateRange] = useState(generateDateRange());
  const [lastUpdated, setLastUpdated] = useState<string>(format(new Date(), 'yyyy-MM-dd HH:mm:ss'));
  const [tabValue, setTabValue] = useState<number>(0);
  const [chartData, setChartData] = useState<any[]>([]);

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
        setLastUpdated(format(new Date(), 'yyyy-MM-dd HH:mm:ss'));
      } catch (error) {
        console.error('여행지수 데이터 가져오기 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRegion]);

  return (
    <Box
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        background: 'white',
        marginTop: 4
      }}
    >
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
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {userRegion?.location_code || '지역별 여행지수'}
        </Typography>
      </Box>

      {/* 탭 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'medium',
              fontSize: '0.9rem'
            },
            '& .Mui-selected': {
              color: '#2c3e50',
              fontWeight: 'bold'
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#2c3e50'
            }
          }}
        >
          <Tab
            icon={<CalendarViewDayIcon />}
            iconPosition="start"
            label="카드 보기"
          />
          <Tab
            icon={<ShowChartIcon />}
            iconPosition="start"
            label="그래프 보기"
          />
        </Tabs>
      </Box>

      {/* 컨텐츠 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 200 }}>
          <CircularProgress sx={{ color: '#2c3e50' }} />
        </Box>
      ) : (
        <Box sx={{ p: 2 }}>
          {/* 카드 보기 탭 */}
          {tabValue === 0 && (
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  overflowX: 'auto',
                  pb: 1,
                  '&::-webkit-scrollbar': {
                    height: 6,
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: alpha('#000', 0.05),
                    borderRadius: 3,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha('#000', 0.15),
                    borderRadius: 3,
                  }
                }}
              >
                {dateRange.map((dateInfo, index) => (
                  <Paper
                    key={dateInfo.formattedDate}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      minWidth: 80,
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
                      {index === 0 && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ ml: 0.5, color: '#2c3e50', fontWeight: 'medium' }}
                        >
                          (오늘)
                        </Typography>
                      )}
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
                  <Line
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