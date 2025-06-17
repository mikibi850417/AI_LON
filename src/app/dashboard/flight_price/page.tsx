"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Grid,
} from "@mui/material";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import FlightIcon from '@mui/icons-material/Flight';

ChartJS.register(...registerables);

// FastAPI 스타일 타입 정의
interface FlightData {
  departure: string;
  destination?: string;
  fare_date: string;
  mean_fare: number;
  airline?: string;
  flight_number?: string;
}

interface PCAItem {
  index: string | number;
  PC1: number;
  PC2?: number;
}

interface PCAResponse {
  df_pca: PCAItem[];
}

interface PCAData {
  dates: string[];
  pc1: number[];
}

// API 베이스 URL 가져오기
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
};

// 오늘 날짜 (yyyy-mm-dd)
const today = new Date().toISOString().slice(0, 10);
// 종료일: 오늘부터 30일 후 (고정)
const calcEndDate = (): string => {
  const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return end.toISOString().slice(0, 10);
};

// 공항 코드와 이름 매핑
const airportNames: Record<string, string> = {
  "CTS": "일본 삿포로 치토세 공항",
  "NRT": "일본 도쿄 나리타 공항",
  "HND": "일본 도쿄 하네다 공항",
  "KIX": "일본 오사카 간사이 공항",
  "FUK": "일본 후쿠오카 공항",
  "HKG": "홍콩 국제공항",
  "BKK": "태국 방콕 수완나품 공항",
  "SGN": "베트남 호치민 떤선녓 공항",
  "DPS": "인도네시아 발리 응우라라이 공항",
  "SIN": "싱가포르 창이 공항",
  "TPE": "대만 타이베이 타오위안 공항",
  "MNL": "필리핀 마닐라 니노이 아키노 공항",
  "CEB": "필리핀 세부 막탄 공항",
  "BKI": "말레이시아 코타키나발루 공항",
  "LAX": "미국 로스앤젤레스 국제공항",
  "JFK": "미국 뉴욕 존 F. 케네디 공항",
  "CDG": "프랑스 파리 샤를 드골 공항",
  "FCO": "이탈리아 로마 피우미치노 공항",
  "BCN": "스페인 바르셀로나 엘프라트 공항",
  "IST": "터키 이스탄불 공항"
};

export default function FlightTrendChart() {
  // 시작 날짜: 사용자가 선택
  const [startDate, setStartDate] = useState(today);
  // 종료일: 오늘부터 30일 후 (고정) - 별도로 지정할 수 없음
  const endDate = calcEndDate();
  const [selectedDepartures, setSelectedDepartures] = useState<string[]>([]);
  const [data, setData] = useState<FlightData[]>([]);
  const [pcaData, setPcaData] = useState<PCAData>({
    dates: [],
    pc1: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API 호출: 항공 데이터 (출발지별 요금)
  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) {
      alert("시작 날짜와 종료 날짜를 모두 입력해주세요.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("start_date", startDate);
      params.append("end_date", endDate);
      // 선택한 출발지가 있으면 추가 (전체 선택은 빈 배열로 처리)
      if (selectedDepartures.length > 0 && !selectedDepartures.includes("All")) {
        selectedDepartures.forEach((dep) => {
          params.append("departures", dep);
        });
      }

      const res = await fetch(
        `${getApiBaseUrl()}/api/flight/db?${params.toString()}`
      );
      if (!res.ok) {
        throw new Error("API 요청 실패");
      }
      const json = await res.json() as FlightData[];
      setData(json);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedDepartures]);

  // API 호출: PCA 데이터 (df_pca 만 반환)
  const fetchPCAData = useCallback(async () => {
    if (!startDate || !endDate) return;
    try {
      const params = new URLSearchParams();
      params.append("start_date", startDate);
      params.append("end_date", endDate);
      // 여기서는 return_df_pca만 true, return_df_segments false로 요청
      params.append("return_df_pca", "true");
      params.append("return_df_segments", "false");

      const res = await fetch(
        `${getApiBaseUrl()}/api/flight/pca?${params.toString()}`
      );
      if (!res.ok) {
        throw new Error("PCA API 요청 실패");
      }
      const json = await res.json() as PCAResponse;
      if (json.df_pca && Array.isArray(json.df_pca)) {
        // 각 항목의 index 값을 yyyy-mm-dd 형식으로 변환
        const dates = json.df_pca.map((item: PCAItem) =>
          new Date(item.index).toISOString().split("T")[0]
        );
        const pc1 = json.df_pca.map((item: PCAItem) => item.PC1);
        setPcaData({ dates, pc1 });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error("PCA 데이터 호출 오류:", errorMessage);
    }
  }, [startDate, endDate]);

  // 컴포넌트가 마운트되거나 시작 날짜, 선택된 출발지가 변경되면 데이터 호출
  useEffect(() => {
    fetchData();
    fetchPCAData();
  }, [fetchData, fetchPCAData]);

  // 항공 데이터: 출발지별 그룹화
  const groupedData: Record<string, FlightData[]> = data.reduce((acc: Record<string, FlightData[]>, cur: FlightData) => {
    const { departure } = cur;
    if (!acc[departure]) {
      acc[departure] = [];
    }
    acc[departure].push(cur);
    return acc;
  }, {});

  // 그룹별 날짜순 정렬 (날짜 문자열 비교 시 ISO 형식이면 괜찮음)
  Object.keys(groupedData).forEach((dep) => {
    groupedData[dep].sort(
      (a: FlightData, b: FlightData) => new Date(a.fare_date).getTime() - new Date(b.fare_date).getTime()
    );
  });

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
        <FlightIcon style={{ marginRight: '8px', color: '#2c3e50' }} />
        Flight Prices
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
                label="조회 시작 날짜"
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
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="departure-select-label">출발지</InputLabel>
                <Select
                  labelId="departure-select-label"
                  multiple
                  value={selectedDepartures}
                  onChange={(e) => {
                    const {
                      target: { value },
                    } = e;
                    setSelectedDepartures(
                      typeof value === "string" ? value.split(",") : value
                    );
                  }}
                  label="출발지"
                  renderValue={(selected) => {
                    if ((selected as string[]).length === 0) return "전체";
                    return (selected as string[])
                      .map(code => airportNames[code] || code)
                      .join(", ");
                  }}
                  sx={{
                    borderRadius: '8px',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2c3e50',
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2c3e50',
                      },
                    }
                  }}
                >
                  <MenuItem value="All">
                    <em>전체</em>
                  </MenuItem>
                  {Object.keys(airportNames).map((dep) => (
                    <MenuItem key={dep} value={dep}>
                      {airportNames[dep]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={fetchData}
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

        {/* 로딩 및 에러 표시 */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#2c3e50' }} />
          </Box>
        )}
        {error && (
          <Box sx={{
            p: 3,
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '8px',
            border: '1px solid #f87171'
          }}>
            Error: {error}
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
                <FlightIcon style={{ marginRight: '8px' }} />
                AI 항공 요금 인사이트
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
                      label: "항공요금 변동지수",
                      data: pcaData.pc1,
                      borderColor: "#3498db",
                      backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return 'rgba(52, 152, 219, 0.2)'; // 기본값 반환

                        // y축 0 위치 계산
                        // const yScale = chart.scales.y;
                        // const zeroY = yScale.getPixelForValue(0); // 사용되지 않는 변수 제거

                        // 그라데이션 생성
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(231, 76, 60, 0.2)'); // 위쪽 (음수값) - 빨간색
                        gradient.addColorStop(0.5, 'rgba(231, 76, 60, 0.05)');
                        gradient.addColorStop(0.5, 'rgba(52, 152, 219, 0.05)');
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
                변동지수는 항공 요금 변동의 주요 추세를 나타냅니다
              </span>
            </Box>
          </Box>
        )}

        {/* 출발지별 요금 차트 */}
        {Object.keys(groupedData).length > 0 && (
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
                <FlightIcon style={{ marginRight: '8px' }} />
                출발지별 편도 요금
              </h2>
            </Box>

            <Box sx={{
              p: 3,
              maxHeight: '600px',  // 최대 높이 설정
              overflow: 'auto',    // 스크롤 적용
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#c1c1c1',
                borderRadius: '10px',
                '&:hover': {
                  background: '#a1a1a1',
                },
              },
            }}>
              <Grid container spacing={2}>
                {Object.keys(groupedData).map((dep, index) => {
                  const depData = groupedData[dep];
                  const labels = depData.map((item: FlightData) => {
                    // 날짜에서 연도 부분 제거하고 월-일만 표시
                    const parts = item.fare_date.split('-');
                    return `${parts[1]}-${parts[2]}`;
                  });
                  const fares = depData.map((item: FlightData) => item.mean_fare);
                  const minFare = Math.min(...fares);
                  const yMin = Math.floor(minFare * 0.7);
                  const color = chartColors[index % chartColors.length];

                  // 출발지가 하나만 선택되었는지 확인
                  const isSingleSelection = Object.keys(groupedData).length === 1;

                  return (
                    <Grid
                      item
                      xs={12}
                      sm={isSingleSelection ? 12 : 6}
                      md={isSingleSelection ? 12 : 4}
                      key={dep}
                    >
                      <Box
                        sx={{
                          border: '1px solid #e2e8f0',
                          p: 2,
                          borderRadius: '12px',
                          height: '100%',
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
                          {airportNames[dep] || dep}
                        </Box>
                        <Box sx={{
                          height: isSingleSelection ? 400 : 250,
                          width: '100%'
                        }}>
                          <Line
                            data={{
                              labels: labels,
                              datasets: [
                                {
                                  label: `${airportNames[dep] || dep}`,
                                  data: fares,
                                  backgroundColor: color.backgroundColor,
                                  borderColor: color.borderColor,
                                  borderWidth: isSingleSelection ? 3 : 2,
                                  fill: true,
                                  tension: 0.4,
                                  pointRadius: isSingleSelection ? 4 : 2,
                                  pointBackgroundColor: "#fff",
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                x: {
                                  title: {
                                    display: isSingleSelection,
                                    text: "날짜",
                                    color: '#64748b'
                                  },
                                  grid: {
                                    display: false
                                  },
                                  ticks: {
                                    color: '#64748b',
                                    maxRotation: 45,
                                    minRotation: 45,
                                    font: {
                                      size: isSingleSelection ? 12 : 10
                                    }
                                  }
                                },
                                y: {
                                  beginAtZero: false,
                                  min: yMin,
                                  title: {
                                    display: isSingleSelection,
                                    text: "요금(원)",
                                    color: '#64748b'
                                  },
                                  grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                  },
                                  ticks: {
                                    color: '#64748b',
                                    font: {
                                      size: isSingleSelection ? 12 : 10
                                    }
                                  }
                                },
                              },
                              plugins: {
                                legend: {
                                  display: isSingleSelection,
                                  position: 'top',
                                  labels: {
                                    boxWidth: 12,
                                    usePointStyle: true,
                                    pointStyle: 'circle',
                                    font: {
                                      size: 14
                                    }
                                  }
                                },
                                tooltip: {
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  titleColor: '#2c3e50',
                                  bodyColor: '#2c3e50',
                                  borderColor: 'rgba(0, 0, 0, 0.1)',
                                  borderWidth: 1,
                                  padding: isSingleSelection ? 10 : 8,
                                  boxPadding: isSingleSelection ? 6 : 4,
                                  usePointStyle: true,
                                  titleFont: {
                                    size: isSingleSelection ? 14 : 12
                                  },
                                  bodyFont: {
                                    size: isSingleSelection ? 14 : 12
                                  },
                                  callbacks: {
                                    label: function (context) {
                                      return `요금: ${context.parsed.y.toLocaleString()}원`;
                                    }
                                  }
                                }
                              },
                            }}
                          />
                        </Box>
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
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                총 {Object.keys(groupedData).length}개 공항 데이터
              </span>
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

// 차트 색상 배열
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