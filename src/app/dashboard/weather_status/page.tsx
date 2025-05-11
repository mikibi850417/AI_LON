"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import CloudIcon from "@mui/icons-material/Cloud";
import UmbrellaIcon from "@mui/icons-material/Umbrella";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import ThermostatIcon from "@mui/icons-material/Thermostat";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const today = new Date();
const startDate = today.toISOString().split("T")[0];
const endDate = new Date();
// API에서 제공하는 최대 일수(30일)로 설정
endDate.setDate(today.getDate() + 30);
const endDateString = endDate.toISOString().split("T")[0];

const API_URL = `${API_BASE_URL}/api/weather?start_date=${startDate}&end_date=${endDateString}`;

// 🌦️ 날씨 상태에 따른 아이콘 매핑
const weatherIcons: { [key: number]: React.ReactNode } = {
  1: <WbSunnyIcon sx={{ color: "gold" }} />, // 맑음
  2: <CloudIcon sx={{ color: "#78909c" }} />, // 구름많음 - 밝은 회색
  3: <CloudIcon sx={{ color: "#455a64" }} />, // 흐림 - 어두운 회색
  4: <UmbrellaIcon sx={{ color: "skyblue" }} />, // 비
  5: <AcUnitIcon sx={{ color: "lightblue" }} />, // 눈
};

// 날짜에 요일 추가하는 함수
const getDayOfWeek = (dateString: string) => {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  // MM-DD 형식의 날짜에 현재 연도를 추가하여 Date 객체 생성
  const currentYear = new Date().getFullYear();
  const date = new Date(`${currentYear}-${dateString}`);
  return days[date.getDay()];
};

// 날짜 표시 형식을 변환하는 함수 추가
const getDisplayDate = (dateString: string) => {
  if (!dateString) return "";

  const currentYear = new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const targetDate = new Date(`${currentYear}-${dateString}`);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate.getTime() === today.getTime()) {
    return "오늘";
  } else if (targetDate.getTime() === tomorrow.getTime()) {
    return "내일";
  }

  return dateString;
};

const WeatherStatusPage = () => {
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [temperatureTrends, setTemperatureTrends] = useState<any[]>([]);
  const [structuredWeather, setStructuredWeather] = useState<{ [location: string]: { [date: string]: any } }>({});
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table">("table");
  const [maxAvailableDays, setMaxAvailableDays] = useState<number>(30);
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [selectedGraphWeek, setSelectedGraphWeek] = useState<number>(0);

  // 📡 FastAPI에서 날씨 데이터 가져오기
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setWeatherData(data);

        // 📊 날짜별 평균 기온 계산
        const dateMap: { [key: string]: { date: string; min_avg: number; max_avg: number } } = {};
        const structuredData: { [location: string]: { [date: string]: any } } = {};

        // 실제로 받아온 날짜 수 계산
        const uniqueDates = new Set<string>();

        data.forEach((entry: any) => {
          uniqueDates.add(entry.date);

          // ✅ 날짜별 평균 온도 데이터 정리
          if (!dateMap[entry.date]) {
            dateMap[entry.date] = { date: entry.date.substring(5), min_avg: 0, max_avg: 0 }; // 📆 연도 제거
          }
          dateMap[entry.date].min_avg += entry.min_temp / 20; // 전국 평균 (13개 지역)
          dateMap[entry.date].max_avg += entry.max_temp / 20;

          // ✅ 지역별 데이터 정리 (행 = 지역, 열 = 날짜)
          if (!structuredData[entry.location_name]) {
            structuredData[entry.location_name] = {};
          }
          structuredData[entry.location_name][entry.date.substring(5)] = entry; // 📆 연도 제거
        });

        // API에서 실제로 제공한 최대 일수 설정
        setMaxAvailableDays(uniqueDates.size);

        setTemperatureTrends(Object.values(dateMap));
        setStructuredWeather(structuredData);
      })
      .catch((err) => console.error("Error fetching weather data:", err));
  }, []);

  // 요일별로 날짜 데이터 정리하는 함수
  const organizeDataByWeekday = () => {
    // 요일 순서: 일, 월, 화, 수, 목, 금, 토
    const weekdayOrder = ["일", "월", "화", "수", "목", "금", "토"];
    const result: { [weekday: string]: { dates: string[], data: any[] } } = {};

    // 요일별 객체 초기화
    weekdayOrder.forEach(day => {
      result[day] = { dates: [], data: [] };
    });

    // 날짜 정렬
    const allDates = Object.keys(structuredWeather)
      .flatMap(location => Object.keys(structuredWeather[location]))
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();

    // 각 날짜를 해당 요일에 배치
    allDates.forEach((date: string) => {
      const weekday = getDayOfWeek(date);
      if (result[weekday]) {
        result[weekday].dates.push(date);
      }
    });

    return result;
  };

  // 📌 정렬된 날짜 목록 (테이블 헤더용)
  const sortedDates = useMemo(() => {
    return Object.keys(structuredWeather)
      .flatMap((location) => Object.keys(structuredWeather[location]))
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  }, [structuredWeather]);

  // 지역 목록
  const locations = Object.keys(structuredWeather);

  // 날씨 상태에 따른 배경색 설정
  const getWeatherColor = (weatherCode: number) => {
    switch (weatherCode) {
      case 1: return "rgba(255, 223, 0, 0.1)"; // 맑음 - 연한 노란색
      case 2: return "rgba(224, 224, 224, 0.15)"; // 구름많음 - 밝은 회색 배경
      case 3: return "rgba(144, 164, 174, 0.15)"; // 흐림 - 어두운 회색 배경
      case 4: return "rgba(135, 206, 235, 0.15)"; // 비 - 연한 하늘색
      case 5: return "rgba(240, 248, 255, 0.2)"; // 눈 - 연한 하얀색
      default: return "transparent";
    }
  };

  // 온도에 따른 색상 설정
  const getTemperatureColor = (temp: number) => {
    if (temp >= 30) return "#FF5252"; // 매우 더움
    if (temp >= 25) return "#FF8A65"; // 더움
    if (temp >= 20) return "#FFD54F"; // 따뜻함
    if (temp >= 15) return "#81C784"; // 쾌적함
    if (temp >= 10) return "#4FC3F7"; // 선선함
    if (temp >= 5) return "#7986CB"; // 쌀쌀함
    if (temp >= 0) return "#9575CD"; // 추움
    return "#7E57C2"; // 매우 추움
  };

  // 요일별로 정리된 데이터
  const weekdayData = useMemo(() => {
    return organizeDataByWeekday();
  }, [structuredWeather]);

  // 선택된 지역과 기간에 따른 온도 데이터 계산
  const filteredTemperatureTrends = useMemo(() => {
    if (!selectedLocation) {
      // 전국 평균 반환 - 누적 방식으로 변경
      return temperatureTrends.filter((item, index) => {
        const dayIndex = index + 1;
        // 선택된 주차에 따라 1일부터 해당 주차의 마지막 날까지 표시
        const endDay = selectedGraphWeek === 2 ? Math.min(35, maxAvailableDays) :
          selectedGraphWeek === 1 ? Math.min(28, maxAvailableDays) :
            Math.min(14, maxAvailableDays);
        return dayIndex >= 1 && dayIndex <= endDay;
      });
    } else {
      // 선택된 지역의 데이터만 반환 - 누적 방식으로 변경
      const locationData = structuredWeather[selectedLocation] || {};

      return Object.keys(locationData)
        .sort()
        .filter((date, index) => {
          const dayIndex = index + 1;
          // 선택된 주차에 따라 1일부터 해당 주차의 마지막 날까지 표시
          const endDay = selectedGraphWeek === 2 ? Math.min(35, maxAvailableDays) :
            selectedGraphWeek === 1 ? Math.min(28, maxAvailableDays) :
              Math.min(14, maxAvailableDays);
          return dayIndex >= 1 && dayIndex <= endDay;
        })
        .map(date => {
          const entry = locationData[date];
          return {
            date,
            min_avg: entry.min_temp,
            max_avg: entry.max_temp
          };
        });
    }
  }, [temperatureTrends, structuredWeather, selectedLocation, selectedGraphWeek, maxAvailableDays]);

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
        <WbSunnyIcon style={{ marginRight: '8px', color: '#2c3e50' }} />
        Weather Status
      </h1>

      {/* 공통 지역 선택 컨트롤 */}
      <Box sx={{
        p: 3,
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        backgroundColor: 'white',
        background: 'linear-gradient(to right, rgba(247, 250, 252, 0.8), rgba(237, 242, 247, 0.8))'
      }}>
        <Box sx={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2
        }}>
          {/* 지역 선택 */}
          <Box sx={{
            display: "flex",
            alignItems: "center",
            position: "relative",
            flex: 1,
            maxWidth: "350px"
          }}>
            <Typography variant="body2" sx={{
              mr: 2,
              fontWeight: "600",
              color: "#334155",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center"
            }}>
              <Box component="span" sx={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#3b82f6",
                display: "inline-block",
                mr: 1
              }}></Box>
              지역 선택
            </Typography>
            <Box sx={{
              position: "relative",
              width: "100%",
              "&:hover": {
                "& .MuiBox-root": {
                  backgroundColor: "#e2e8f0"
                }
              }
            }}>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#fff",
                  width: "100%",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  appearance: "none",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s ease"
                }}
              >
                <option value="">전국</option>
                {locations.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              <Box sx={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "#64748b",
                fontSize: "0.8rem",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                backgroundColor: "#f1f5f9",
                transition: "all 0.2s ease"
              }}>
                ▼
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 메인 콘텐츠 영역 */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%'
      }}>
        {/* 📊 최고/최저 온도 트렌드 그래프 */}
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
              <ThermostatIcon style={{ marginRight: '8px' }} />
              {selectedLocation ? `${selectedLocation} 기온 변화` : '전국 평균 기온 변화'}
            </h2>
          </Box>

          {/* 그래프 필터 옵션 */}
          <Box sx={{
            p: 3,
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            background: 'linear-gradient(to right, rgba(247, 250, 252, 0.8), rgba(237, 242, 247, 0.8))'
          }}>
            <Box sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2
            }}>
              {/* 기간 선택 */}
              <Box sx={{
                display: "flex",
                alignItems: "center",
                position: "relative",
                flex: 1,
                maxWidth: "350px"
              }}>
                <Typography variant="body2" sx={{
                  mr: 2,
                  fontWeight: "600",
                  color: "#334155",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <Box component="span" sx={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#f59e0b",
                    display: "inline-block",
                    mr: 1
                  }}></Box>
                  기간 선택
                </Typography>
                <Box sx={{
                  position: "relative",
                  width: "100%",
                  "&:hover": {
                    "& .MuiBox-root": {
                      backgroundColor: "#e2e8f0"
                    }
                  }
                }}>
                  <select
                    value={selectedGraphWeek}
                    onChange={(e) => setSelectedGraphWeek(Number(e.target.value))}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#fff",
                      width: "100%",
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      appearance: "none",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {Array.from({ length: Math.min(3, Math.ceil(maxAvailableDays / 14)) }).map((_, index) => {
                      // 마지막 옵션이 5주치가 되도록 조정
                      const weekCount = index === 2 ? 5 : (index + 1) * 2;

                      return (
                        <option key={index} value={index}>
                          {weekCount}주치
                        </option>
                      );
                    })}
                  </select>
                  <Box sx={{
                    position: "absolute",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#64748b",
                    fontSize: "0.8rem",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    backgroundColor: "#f1f5f9",
                    transition: "all 0.2s ease"
                  }}>
                    ▼
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: 3 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={filteredTemperatureTrends}
                margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5252" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#FF5252" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4FC3F7" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4FC3F7" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickFormatter={(value) => `${Math.round(value)}°`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: 'none',
                    padding: '10px'
                  }}
                  formatter={(value: any) => [`${typeof value === 'number' ? Math.round(value) : value}°C`, '']}
                  labelFormatter={(label) => `${label} 날짜`}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingTop: '10px' }}
                />
                <Line
                  type="monotone"
                  dataKey="max_avg"
                  stroke="#FF5252"
                  strokeWidth={3}
                  name="최고 기온"
                  dot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#FF5252' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#FF5252' }}
                  fillOpacity={1}
                  fill="url(#colorMax)"
                />
                <Line
                  type="monotone"
                  dataKey="min_avg"
                  stroke="#4FC3F7"
                  strokeWidth={3}
                  name="최저 기온"
                  dot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#4FC3F7' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#4FC3F7' }}
                  fillOpacity={1}
                  fill="url(#colorMin)"
                />
              </LineChart>
            </ResponsiveContainer>
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

        {/* 테이블 뷰 - 요일별로 정렬 */}
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
              <CloudIcon style={{ marginRight: '8px' }} />
              {selectedLocation ? `${selectedLocation} 날씨 정보` : '전국 날씨 정보'}
            </h2>
          </Box>

          {/* 주차 선택만 남김 */}
          <Box sx={{
            p: 3,
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            background: 'linear-gradient(to right, rgba(247, 250, 252, 0.8), rgba(237, 242, 247, 0.8))'
          }}>
            <Box sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2
            }}>
              {/* 주차 선택 */}
              <Box sx={{
                display: "flex",
                alignItems: "center",
                position: "relative",
                maxWidth: "350px"
              }}>
                <Typography variant="body2" sx={{
                  mr: 2,
                  fontWeight: "600",
                  color: "#334155",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <Box component="span" sx={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#f59e0b",
                    display: "inline-block",
                    mr: 1
                  }}></Box>
                  기간 선택
                </Typography>
                <Box sx={{
                  position: "relative",
                  width: "100%",
                  "&:hover": {
                    "& .MuiBox-root": {
                      backgroundColor: "#e2e8f0"
                    }
                  }
                }}>
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#fff",
                      width: "100%",
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      appearance: "none",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <option value={0}>1주차 </option>
                    <option value={1}>2주차 </option>
                    <option value={2}>3주차 </option>
                    <option value={3}>4주차 </option>
                    <option value={4}>5주차 </option>
                  </select>
                  <Box sx={{
                    position: "absolute",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#64748b",
                    fontSize: "0.8rem",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    backgroundColor: "#f1f5f9",
                    transition: "all 0.2s ease"
                  }}>
                    ▼
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: 3 }}>
            <TableContainer
              sx={{
                maxWidth: "100%",
                overflowX: "auto",
                mx: "auto",
                maxHeight: "600px",
                overflowY: "auto"
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: "rgba(44, 62, 80, 0.05)" }}>
                    <TableCell
                      align="center"
                      sx={{
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        color: "#2c3e50",
                        position: "sticky",
                        left: 0,
                        zIndex: 3,
                        backgroundColor: "white"
                      }}
                    >
                      지역
                    </TableCell>
                    {/* 요일 헤더 대신 날짜 범위 표시 - 선택된 주차에 따라 표시 */}
                    {Array.from({ length: 7 }).map((_, index) => {
                      const dayIndex = selectedWeek * 7 + index;
                      const dateString = sortedDates[dayIndex];
                      const weekday = dateString ? getDayOfWeek(dateString) : "";
                      const displayDate = dateString ? getDisplayDate(dateString) : "";

                      return (
                        <TableCell
                          key={index}
                          align="center"
                          sx={{
                            fontSize: "0.9rem",
                            fontWeight: "bold",
                            color: "#2c3e50",
                            width: "12%"
                          }}
                        >
                          {dateString ? `${displayDate} (${weekday})` : ""}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(structuredWeather)
                    .filter(([location]) => !selectedLocation || location === selectedLocation)
                    .map(([location, data], index) => {
                      return (
                        <TableRow
                          key={location}
                          sx={{ bgcolor: index % 2 === 0 ? "rgba(0,0,0,0.02)" : "white" }}
                        >
                          <TableCell
                            align="center"
                            sx={{
                              fontSize: "0.9rem",
                              fontWeight: "bold",
                              borderRight: "1px solid rgba(0,0,0,0.1)",
                              position: "sticky",
                              left: 0,
                              zIndex: 2,
                              backgroundColor: index % 2 === 0 ? "rgba(0,0,0,0.02)" : "white",
                              height: "100px",
                              verticalAlign: "middle"
                            }}
                          >
                            {location}
                          </TableCell>
                          {Array.from({ length: 7 }).map((_, index) => {
                            const dayIndex = selectedWeek * 7 + index;
                            const dateForDay = sortedDates[dayIndex];
                            const weatherForDate = dateForDay ? data[dateForDay] : null;

                            return (
                              <TableCell
                                key={index}
                                align="center"
                                sx={{
                                  fontSize: "0.85rem",
                                  bgcolor: weatherForDate ? getWeatherColor(weatherForDate.weather_code) : "transparent",
                                  p: 1
                                }}
                              >
                                {weatherForDate ? (
                                  <>
                                    <Box sx={{ fontSize: "1.2rem", mb: 0.5 }}>
                                      {weatherIcons[weatherForDate.weather_code] || "❓"}
                                    </Box>
                                    <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: getTemperatureColor(weatherForDate.min_temp),
                                          fontWeight: "bold"
                                        }}
                                      >
                                        {weatherForDate.min_temp}°
                                      </Typography>
                                      <Typography variant="caption">/</Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: getTemperatureColor(weatherForDate.max_temp),
                                          fontWeight: "bold"
                                        }}
                                      >
                                        {weatherForDate.max_temp}°
                                      </Typography>
                                    </Box>
                                  </>
                                ) : (
                                  "--"
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
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
      </Box>
    </Box>
  );
};

export default WeatherStatusPage;
