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
endDate.setDate(today.getDate() + 13);
const endDateString = endDate.toISOString().split("T")[0];

const API_URL = `${API_BASE_URL}/api/weather?start_date=${startDate}&end_date=${endDateString}`;

// 🌦️ 날씨 상태에 따른 아이콘 매핑
const weatherIcons: { [key: number]: React.ReactNode } = {
  1: <WbSunnyIcon sx={{ color: "gold" }} />, // 맑음
  2: <CloudIcon sx={{ color: "gray" }} />, // 흐림
  3: <UmbrellaIcon sx={{ color: "skyblue" }} />, // 비
  4: <AcUnitIcon sx={{ color: "lightblue" }} />, // 눈
};

// 날짜에 요일 추가하는 함수
const getDayOfWeek = (dateString: string) => {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  // MM-DD 형식의 날짜에 현재 연도를 추가하여 Date 객체 생성
  const currentYear = new Date().getFullYear();
  const date = new Date(`${currentYear}-${dateString}`);
  return days[date.getDay()];
};

const WeatherStatusPage = () => {
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [temperatureTrends, setTemperatureTrends] = useState<any[]>([]);
  const [structuredWeather, setStructuredWeather] = useState<{ [location: string]: { [date: string]: any } }>({});
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table">("table");

  // 📡 FastAPI에서 날씨 데이터 가져오기
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setWeatherData(data);

        // 📊 날짜별 평균 기온 계산
        const dateMap: { [key: string]: { date: string; min_avg: number; max_avg: number } } = {};
        const structuredData: { [location: string]: { [date: string]: any } } = {};

        data.forEach((entry: any) => {
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

        setTemperatureTrends(Object.values(dateMap));
        setStructuredWeather(structuredData);
      })
      .catch((err) => console.error("Error fetching weather data:", err));
  }, []);

  // 요일별로 날짜 데이터 정리하는 함수
  const organizeDataByWeekday = () => {
    // 요일 순서: 월, 화, 수, 목, 금, 토, 일
    const weekdayOrder = ["월", "화", "수", "목", "금", "토", "일"];
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
      case 2: return "rgba(169, 169, 169, 0.1)"; // 흐림 - 연한 회색
      case 3: return "rgba(135, 206, 235, 0.1)"; // 비 - 연한 하늘색
      case 4: return "rgba(240, 248, 255, 0.2)"; // 눈 - 연한 하얀색
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
              전국 평균 기온 변화
            </h2>
          </Box>

          <Box sx={{ p: 3 }}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={temperatureTrends}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="max_avg"
                  stroke="#FF5252"
                  strokeWidth={2}
                  name="최고 기온"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="min_avg"
                  stroke="#4FC3F7"
                  strokeWidth={2}
                  name="최저 기온"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
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
              지역별 날씨 정보
            </h2>
          </Box>

          {/* 지역 선택 */}
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
            <Box sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              position: "relative"
            }}>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#fff",
                  width: "200px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  appearance: "none"
                }}
              >
                <option value="">전체 지역</option>
                {locations.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              <Box sx={{
                position: "absolute",
                right: "10px",
                pointerEvents: "none",
                color: "#2c3e50"
              }}>
                ▼
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: 3 }}>
            <TableContainer
              sx={{
                maxWidth: "100%",
                overflowX: "auto",
                mx: "auto",
                maxHeight: "600px", // 테이블 최대 높이 설정
                overflowY: "auto"   // 세로 스크롤 활성화
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
                        position: "sticky",  // 첫 번째 열 고정
                        left: 0,
                        zIndex: 3,
                        backgroundColor: "white"
                      }}
                    >
                      지역
                    </TableCell>
                    {["월", "화", "수", "목", "금", "토", "일"].map(day => (
                      <TableCell
                        key={day}
                        align="center"
                        sx={{
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                          color: "#2c3e50",
                          width: "12%"
                        }}
                      >
                        {day}요일
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(structuredWeather)
                    .filter(([location]) => !selectedLocation || location === selectedLocation)
                    .map(([location, data], index) => (
                      <React.Fragment key={location}>
                        {/* 첫 주 */}
                        <TableRow sx={{ bgcolor: index % 2 === 0 ? "rgba(0,0,0,0.02)" : "white" }}>
                          <TableCell
                            align="center"
                            sx={{
                              fontSize: "0.9rem",
                              fontWeight: "bold",
                              borderRight: "1px solid rgba(0,0,0,0.1)",
                              position: "sticky",  // 첫 번째 열 고정
                              left: 0,
                              zIndex: 2,
                              backgroundColor: index % 2 === 0 ? "rgba(0,0,0,0.02)" : "white"
                            }}
                            rowSpan={2}
                          >
                            {location}
                          </TableCell>
                          {["월", "화", "수", "목", "금", "토", "일"].map(day => {
                            const dateForDay = weekdayData[day]?.dates[0];
                            const weatherForDate = dateForDay ? data[dateForDay] : null;

                            return (
                              <TableCell
                                key={`${day}-0`}
                                align="center"
                                sx={{
                                  fontSize: "0.85rem",
                                  bgcolor: weatherForDate ? getWeatherColor(weatherForDate.weather_code) : "transparent",
                                  p: 1
                                }}
                              >
                                {weatherForDate ? (
                                  <>
                                    <Typography variant="caption" sx={{ display: "block", fontWeight: "bold", mb: 0.5 }}>
                                      {dateForDay}
                                    </Typography>
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

                        {/* 둘째 주 */}
                        <TableRow sx={{ bgcolor: index % 2 === 0 ? "rgba(0,0,0,0.02)" : "white" }}>
                          {["월", "화", "수", "목", "금", "토", "일"].map(day => {
                            const dateForDay = weekdayData[day]?.dates[1];
                            const weatherForDate = dateForDay ? data[dateForDay] : null;

                            return (
                              <TableCell
                                key={`${day}-1`}
                                align="center"
                                sx={{
                                  fontSize: "0.85rem",
                                  bgcolor: weatherForDate ? getWeatherColor(weatherForDate.weather_code) : "transparent",
                                  p: 1
                                }}
                              >
                                {weatherForDate ? (
                                  <>
                                    <Typography variant="caption" sx={{ display: "block", fontWeight: "bold", mb: 0.5 }}>
                                      {dateForDay}
                                    </Typography>
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
                      </React.Fragment>
                    ))}
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
