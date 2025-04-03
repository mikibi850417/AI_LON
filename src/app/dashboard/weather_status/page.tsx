"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const today = new Date();
const startDate = today.toISOString().split("T")[0];
const endDate = new Date();
endDate.setDate(today.getDate() + 13);
const endDateString = endDate.toISOString().split("T")[0];

const API_URL = `${API_BASE_URL}/api/weather?start_date=${startDate}&end_date=${endDateString}`;

// 🌦️ 날씨 상태에 따른 아이콘 매핑
const weatherIcons: { [key: number]: JSX.Element } = {
  1: <WbSunnyIcon sx={{ color: "gold" }} />, // 맑음
  2: <CloudIcon sx={{ color: "gray" }} />, // 흐림
  3: <UmbrellaIcon sx={{ color: "skyblue" }} />, // 비
  4: <AcUnitIcon sx={{ color: "lightblue" }} />, // 눈
};

const WeatherStatusPage = () => {
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [temperatureTrends, setTemperatureTrends] = useState<any[]>([]);
  const [structuredWeather, setStructuredWeather] = useState<{ [location: string]: { [date: string]: any } }>({});

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

  // 📌 정렬된 날짜 목록 (테이블 헤더용)
  const sortedDates = Object.keys(structuredWeather)
    .flatMap((location) => Object.keys(structuredWeather[location]))
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();

  return (
    <Box sx={{ p: 2, maxWidth: "1100px", mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 3, textAlign: "center", fontSize: "1.2rem" }}>
        전국 2주간 날씨 현황 🌤️
      </Typography>

      {/* 📊 최고/최저 온도 트렌드 그래프 (위로 이동) */}
      <Typography variant="h6" sx={{ mb: 2, textAlign: "center", fontSize: "1rem" }}>
        온도 변화 트렌드 📈
      </Typography>
      <Box sx={{ mb: 4 }}>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={temperatureTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="max_avg" stroke="red" name="최고 기온" />
            <Line type="monotone" dataKey="min_avg" stroke="blue" name="최저 기온" />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* 📋 지역별 날씨 상세 정보 (행: 지역, 열: 날짜) */}
      <Typography variant="h6" sx={{ mb: 2, textAlign: "center", fontSize: "1rem" }}>
        지역별 날씨 상세 정보 🌦️
      </Typography>
      <TableContainer component={Paper} sx={{ maxWidth: "100%", overflowX: "auto", mx: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontSize: "0.85rem", fontWeight: "bold" }}>지역</TableCell>
              {sortedDates.map((date) => (
                <TableCell key={date} align="center" sx={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                  {date}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(structuredWeather).map(([location, data]) => (
              <TableRow key={location}>
                <TableCell align="center" sx={{ fontSize: "0.85rem" }}>
                  {/* 🌍 지역명 두 줄로 표시 */}
                  {location.split(" ").map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </TableCell>
                {sortedDates.map((date) => (
                  <TableCell key={date} align="center" sx={{ fontSize: "0.8rem" }}>
                    {data[date] ? (
                      <>
                        {weatherIcons[data[date].weather_code] || "❓"} <br />
                        {data[date].min_temp}°C / {data[date].max_temp}°C
                      </>
                    ) : (
                      "--"
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WeatherStatusPage;
