"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  CircularProgress,
  Grid,
  Button,
} from "@mui/material";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

ChartJS.register(...registerables);

// 기본 날짜 결정 함수: 오늘 날짜 반환
const getDefaultDate = (): string => {
  const now = new Date();
  return now.toISOString().split("T")[0];
};

// 종료 날짜를 계산하는 함수: 시작일로부터 +32일
const getEndDate = (startDate: string): string => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + 32);
  return date.toISOString().split("T")[0];
};

// API 베이스 URL 가져오기
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
};

export default function CompetitorHotelTrends() {
  const [startDate, setStartDate] = useState(getDefaultDate());
  const [endDate, setEndDate] = useState(getEndDate(getDefaultDate()));
  const [loading, setLoading] = useState(false);
  // hotelData: 각 호텔별로 { dates, prices } 보관
  const [hotelData, setHotelData] = useState<Record<string, { dates: string[]; prices: number[] }>>({});
  // pcaData: PCA 분석 결과 (PC1 트렌드) 보관 (날짜는 yyyy-mm-dd)
  const [pcaData, setPcaData] = useState<{ dates: string[]; pc1: number[] }>({
    dates: [],
    pc1: [],
  });

  // 경쟁 호텔 가격 데이터 API 호출 (평균 값, user_id는 "0"으로 고정)
  const fetchHotelPrices = async (start: string, end: string) => {
    setLoading(true);
    const API_BASE = getApiBaseUrl();
    try {
      const response = await fetch(
        `${API_BASE}/api/competitor-hotels/price?user_id=0&price_type=avg&start_date=${start}&end_date=${end}`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      // 각 레코드: { hotel_name, date, avg_price }
      const groupedData: Record<string, { dates: string[]; prices: number[] }> = {};
      data.forEach((entry: any) => {
        const { hotel_name, date, avg_price } = entry;
        if (!groupedData[hotel_name]) {
          groupedData[hotel_name] = { dates: [], prices: [] };
        }
        groupedData[hotel_name].dates.push(date);
        groupedData[hotel_name].prices.push(parseFloat(avg_price));
      });
      setHotelData(groupedData);
    } catch (error) {
      console.error("Error fetching competitor price data:", error);
      alert("데이터 로드에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 경쟁 호텔 PCA 데이터 API 호출
  const fetchHotelPCA = async (start: string, end: string) => {
    const API_BASE = getApiBaseUrl();
    try {
      const response = await fetch(
        `${API_BASE}/api/competitor-hotels/pca?start_date=${start}&end_date=${end}&return_df_pca=true&return_df_segments=false`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      // data.df_pca: 배열 형태 [{ index, PC1, ... }, ...]
      if (data.df_pca && Array.isArray(data.df_pca)) {
        const dates = data.df_pca.map((item: any) =>
          new Date(item.index).toISOString().split("T")[0]
        );
        const pc1 = data.df_pca.map((item: any) => item.PC1);
        setPcaData({ dates, pc1 });
      }
    } catch (error) {
      console.error("Error fetching competitor PCA data:", error);
    }
  };

  // 시작 날짜 변경 시 종료 날짜 재계산 및 데이터 호출
  useEffect(() => {
    const newEndDate = getEndDate(startDate);
    setEndDate(newEndDate);
    fetchHotelPrices(startDate, newEndDate);
    fetchHotelPCA(startDate, newEndDate);
  }, [startDate]);

  // 모든 호텔의 날짜가 동일하다고 가정하여, 첫 호텔의 날짜 배열을 x축 라벨로 사용
  const commonLabels =
    Object.keys(hotelData).length > 0
      ? hotelData[Object.keys(hotelData)[0]].dates
      : [];

  return (
    <Box sx={{
      padding: { xs: '16px', md: '24px' },
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      minHeight: 'calc(100vh - 100px)'
    }}>
      {/* 헤더 섹션 */}
      <h1 className="text-2xl font-bold mb-4" style={{
        color: '#2c3e50',
        padding: '16px 0',
        borderBottom: '2px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center'
      }}>
        <TrendingUpIcon style={{ marginRight: '8px', color: '#2c3e50' }} />
        Hotel Trends
      </h1>

      {/* 메인 콘텐츠 영역 */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%'
      }}>
        {/* 필터 영역 */}
        <Box sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          backgroundColor: 'white'
        }}>
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <TextField
                label="시작 날짜"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '&:hover fieldset': {
                      borderColor: '#2c3e50',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2c3e50',
                    },
                  }
                }}
              />
              <TextField
                label="종료 날짜"
                type="date"
                value={endDate}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '&:hover fieldset': {
                      borderColor: '#2c3e50',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2c3e50',
                    },
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={() => {
                  fetchHotelPrices(startDate, endDate);
                  fetchHotelPCA(startDate, endDate);
                }}
                sx={{
                  backgroundColor: '#2c3e50',
                  '&:hover': {
                    backgroundColor: '#34495e',
                  },
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  padding: '8px 16px'
                }}
              >
                검색
              </Button>
            </Box>
          </Box>
        </Box>

        {/* 로딩 표시 */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#2c3e50' }} />
          </Box>
        )}

        {/* PCA 트렌드 차트 */}
        {pcaData.dates.length > 0 && (
          <Box sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            backgroundColor: 'white'
          }}>
            <Box sx={{
              p: 3,
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(90deg, #2c3e50 0%, #34495e 100%)',
              color: 'white'
            }}>
              <h2 className="text-lg font-semibold" style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon style={{ marginRight: '8px' }} />
                AI 기반 주요 호텔 인사이트
              </h2>
            </Box>

            <Box sx={{ p: 3 }}>
              <Line
                data={{
                  labels: pcaData.dates.map(date => {
                    // 날짜에서 연도 부분 제거하고 월-일만 표시
                    const parts = date.split('-');
                    return `${parts[1]}-${parts[2]}`;
                  }),
                  datasets: [
                    {
                      label: "호텔 가격 변동지수",
                      data: pcaData.pc1,
                      borderColor: "#3498db",
                      backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return 'rgba(52, 152, 219, 0.2)'; // 기본값 반환

                        // y축 0 위치 계산
                        const yScale = chart.scales.y;
                        const zeroY = yScale.getPixelForValue(0);

                        // 그라데이션 생성
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(231, 76, 60, 0.2)'); // 위쪽 (음수값) - 빨간색
                        gradient.addColorStop(yScale.getPixelForValue(0) / chartArea.bottom, 'rgba(231, 76, 60, 0.05)');
                        gradient.addColorStop(yScale.getPixelForValue(0) / chartArea.bottom, 'rgba(52, 152, 219, 0.05)');
                        gradient.addColorStop(1, 'rgba(52, 152, 219, 0.2)'); // 아래쪽 (양수값) - 파란색

                        return gradient;
                      },
                      fill: true,
                      tension: 0.4,
                      borderWidth: 2,
                      pointRadius: 3,
                      pointBackgroundColor: "#fff",
                      pointBorderColor: (context) => {
                        // 포인트 색상도 값에 따라 변경
                        const value = context.raw as number;
                        return value >= 0 ? '#3498db' : '#e74c3c';
                      },
                      pointHoverRadius: 5,
                      segment: {
                        borderColor: (context) => {
                          // 선 색상도 값에 따라 변경
                          const p0 = context.p0.parsed;
                          const p1 = context.p1.parsed;

                          // 두 점이 모두 0보다 크거나 같으면 파란색
                          if (p0.y >= 0 && p1.y >= 0) return '#3498db';
                          // 두 점이 모두 0보다 작으면 빨간색
                          if (p0.y < 0 && p1.y < 0) return '#e74c3c';
                          // 0을 교차하는 경우 - 중간 색상 사용
                          return '#9b59b6'; // 중간 색상(보라색)으로 표시
                        }
                      }
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    title: {
                      display: false,
                    },
                    legend: {
                      position: 'top',
                      labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      titleColor: '#2c3e50',
                      bodyColor: '#2c3e50',
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                      borderWidth: 1,
                      padding: 12,
                      boxPadding: 6,
                      usePointStyle: true,
                      bodyFont: {
                        family: "'Pretendard', 'Noto Sans KR', sans-serif"
                      },
                      titleFont: {
                        family: "'Pretendard', 'Noto Sans KR', sans-serif",
                        weight: 'bold'
                      }
                    }
                  },
                  scales: {
                    x: {
                      title: { display: false },
                      grid: {
                        display: false
                      },
                      ticks: {
                        color: '#64748b'
                      }
                    },
                    y: {
                      title: { display: true, text: "변동지수", color: '#64748b' },
                      grid: {
                        color: (context) => {
                          // y=0 선은 더 진하게 표시
                          return context.tick.value === 0 ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)';
                        }
                      },
                      ticks: {
                        color: '#64748b'
                      }
                    },
                  },
                }}
              />
            </Box>

            <Box sx={{
              p: 2,
              borderTop: '1px solid rgba(0, 0, 0, 0.05)',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                변동지수는 호텔 가격 변동의 주요 추세를 나타냅니다
              </span>
            </Box>
          </Box>
        )}

        {/* 개별 호텔 가격 차트 */}
        {Object.keys(hotelData).length > 0 && (
          <Box sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            backgroundColor: 'white'
          }}>
            <Box sx={{
              p: 3,
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(90deg, #2c3e50 0%, #34495e 100%)',
              color: 'white'
            }}>
              <h2 className="text-lg font-semibold" style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon style={{ marginRight: '8px' }} />
                주요 호텔별 요금
              </h2>
            </Box>

            <Box sx={{ p: 3 }}>
              <Grid container spacing={2} sx={{
                // 그리드 컨테이너 스타일 수정
                margin: 0,
                width: '100%',
                '& .MuiGrid-item': {
                  padding: '8px', // 더 명확한 패딩 적용
                  boxSizing: 'border-box'
                }
              }}>
                {Object.keys(hotelData).map((hotel, index) => {
                  const color = chartColors[index % chartColors.length];
                  return (
                    <Grid item xs={12} sm={6} md={4} key={hotel}>
                      <Box
                        sx={{
                          border: '1px solid #e2e8f0',
                          p: 2,
                          borderRadius: '12px',
                          height: '100%',
                          backgroundColor: '#ffffff', // 배경색 명시적 설정
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                            transform: 'translateY(-4px)'
                          }
                        }}
                      >
                        <Box
                          sx={{
                            mb: 2,
                            fontWeight: "bold",
                            textAlign: "center",
                            color: '#2c3e50',
                            fontSize: '1rem',
                            padding: '8px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(44, 62, 80, 0.05)'
                          }}
                        >
                          {hotel}
                        </Box>
                        <Line
                          data={{
                            labels: hotelData[hotel].dates.map(date => {
                              // 날짜에서 연도 부분 제거하고 월-일만 표시
                              const parts = date.split('-');
                              return `${parts[1]}-${parts[2]}`;
                            }),
                            datasets: [
                              {
                                label: `${hotel} 가격 추세`,
                                data: hotelData[hotel].prices,
                                backgroundColor: color.backgroundColor,
                                borderColor: color.borderColor,
                                borderWidth: 2,
                                fill: true,
                                tension: 0.4,
                                pointRadius: 2,
                                pointBackgroundColor: "#fff",
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            scales: {
                              x: {
                                title: { display: false },
                                grid: {
                                  display: false
                                },
                                ticks: {
                                  color: '#64748b',
                                  maxRotation: 45,
                                  minRotation: 45
                                }
                              },
                              y: {
                                title: { display: false },
                                grid: {
                                  color: 'rgba(0, 0, 0, 0.05)'
                                },
                                ticks: {
                                  color: '#64748b'
                                }
                              },
                            },
                            plugins: {
                              legend: { display: false },
                              tooltip: {
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                titleColor: '#2c3e50',
                                bodyColor: '#2c3e50',
                                borderColor: 'rgba(0, 0, 0, 0.1)',
                                borderWidth: 1,
                                padding: 8,
                                boxPadding: 4,
                                usePointStyle: true,
                                callbacks: {
                                  label: function (context) {
                                    return `가격: ${context.parsed.y.toLocaleString()}원`;
                                  }
                                }
                              }
                            },
                          }}
                        />
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>

            <Box sx={{
              p: 2,
              borderTop: '1px solid rgba(0, 0, 0, 0.05)',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                마지막 업데이트: {new Date().toLocaleString('ko-KR')}
              </span>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// 차트 색상 배열 추가
const chartColors = [
  { backgroundColor: "rgba(52, 152, 219, 0.2)", borderColor: "#3498db" },
  { backgroundColor: "rgba(230, 126, 34, 0.2)", borderColor: "#e67e22" },
  { backgroundColor: "rgba(46, 204, 113, 0.2)", borderColor: "#2ecc71" },
  { backgroundColor: "rgba(155, 89, 182, 0.2)", borderColor: "#9b59b6" },
  { backgroundColor: "rgba(231, 76, 60, 0.2)", borderColor: "#e74c3c" },
  { backgroundColor: "rgba(26, 188, 156, 0.2)", borderColor: "#1abc9c" },
  { backgroundColor: "rgba(241, 196, 15, 0.2)", borderColor: "#f1c40f" },
  { backgroundColor: "rgba(52, 73, 94, 0.2)", borderColor: "#34495e" },
  { backgroundColor: "rgba(22, 160, 133, 0.2)", borderColor: "#16a085" },
];

// 그라데이션 생성 함수
const createGradient = (
  context: {
    p0: { x: number; y: number; parsed: { y: number } };
    p1: { x: number; y: number; parsed: { y: number } };
    chart: { ctx: CanvasRenderingContext2D }
  },
  colorStart: string,
  colorEnd: string
): CanvasGradient => {
  const { p0, p1 } = context;
  const gradient = context.chart.ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  return gradient;
};