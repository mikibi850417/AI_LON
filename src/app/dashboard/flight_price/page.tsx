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

ChartJS.register(...registerables);

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

export default function FlightTrendChart() {
  // 시작 날짜: 사용자가 선택
  const [startDate, setStartDate] = useState(today);
  // 종료일: 오늘부터 30일 후 (고정) - 별도로 지정할 수 없음
  const endDate = calcEndDate();
  const [selectedDepartures, setSelectedDepartures] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [pcaData, setPcaData] = useState<{ dates: string[]; pc1: number[] }>({
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
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
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
      const json = await res.json();
      if (json.df_pca && Array.isArray(json.df_pca)) {
        // 각 항목의 index 값을 yyyy-mm-dd 형식으로 변환
        const dates = json.df_pca.map((item: any) =>
          new Date(item.index).toISOString().split("T")[0]
        );
        const pc1 = json.df_pca.map((item: any) => item.PC1);
        setPcaData({ dates, pc1 });
      }
    } catch (err: any) {
      console.error("PCA 데이터 호출 오류:", err.message);
    }
  }, [startDate, endDate]);

  // 컴포넌트가 마운트되거나 시작 날짜, 선택된 출발지가 변경되면 데이터 호출
  useEffect(() => {
    fetchData();
    fetchPCAData();
  }, [fetchData, fetchPCAData]);

  // 항공 데이터: 출발지별 그룹화
  const groupedData = data.reduce((acc: any, cur: any) => {
    const { departure } = cur;
    if (!acc[departure]) {
      acc[departure] = [];
    }
    acc[departure].push(cur);
    return acc;
  }, {} as Record<string, any[]>);

  // 그룹별 날짜순 정렬 (날짜 문자열 비교 시 ISO 형식이면 괜찮음)
  Object.keys(groupedData).forEach((dep) => {
    groupedData[dep].sort(
      (a, b) => new Date(a.fare_date).getTime() - new Date(b.fare_date).getTime()
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* 입력 폼: 시작 날짜, 출발지 선택 */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
          alignItems: "center",
        }}
      >
        <TextField
          label="조회 시작 날짜"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
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
              return (selected as string[]).join(", ");
            }}
          >
            <MenuItem value="All">
              <em>전체</em>
            </MenuItem>
            {departureOptions.map((dep) => (
              <MenuItem key={dep} value={dep}>
                {dep}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={fetchData}>
          검색
        </Button>
      </Box>

      {loading && <CircularProgress />}
      {error && <Box color="error.main">Error: {error}</Box>}

      {/* 상단에 PCA 트렌드 차트 (PC1) 추가 */}
      {pcaData.dates.length > 0 && (
        <Box sx={{ mb: 5 }}>
          <h3>PCA 기반 PC1 트렌드</h3>
          <Line
            data={{
              labels: pcaData.dates,
              datasets: [
                {
                  label: "PC1 Trend",
                  data: pcaData.pc1,
                  borderColor: "blue",
                  backgroundColor: "lightblue",
                  fill: false,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: "PCA 기반 PC1 트렌드",
                },
              },
              scales: {
                x: {
                  title: { display: true, text: "날짜" },
                },
                y: {
                  title: { display: true, text: "PC1" },
                },
              },
            }}
          />
        </Box>
      )}

      {/* 출발지별 요금 차트 (3열 그리드) */}
      {Object.keys(groupedData).length > 0 && (
        <Grid container spacing={2}>
          {Object.keys(groupedData).map((dep, index) => {
            const depData = groupedData[dep];
            const labels = depData.map((item) => item.fare_date);
            const fares = depData.map((item) => item.mean_fare);
            const minFare = Math.min(...fares);
            const yMin = Math.floor(minFare * 0.7);
            const color = chartColors[index % chartColors.length];
            return (
              <Grid item xs={12} sm={6} md={4} key={dep}>
                <Box
                  sx={{
                    border: "1px solid #ccc",
                    p: 1,
                    borderRadius: 2,
                    height: "100%",
                  }}
                >
                  <Box
                    sx={{
                      mb: 1,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {dep} (요금 추세)
                  </Box>
                  <Line
                    data={{
                      labels: labels,
                      datasets: [
                        {
                          label: `${dep} 요금 추세`,
                          data: fares,
                          backgroundColor: color.backgroundColor,
                          borderColor: color.borderColor,
                          borderWidth: 1,
                          fill: false,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      scales: {
                        x: {
                          title: { display: true, text: "날짜" },
                        },
                        y: {
                          beginAtZero: false,
                          min: yMin,
                          title: { display: true, text: "평균 요금" },
                        },
                      },
                      plugins: {
                        legend: { display: false },
                      },
                    }}
                  />
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

// 출발지 옵션 및 차트 색상 배열
const departureOptions = [
  "CTS",
  "NRT",
  "HND",
  "KIX",
  "FUK",
  "CJU",
  "PUS",
  "HKG",
  "BKK",
  "SGN",
  "DPS",
  "SIN",
  "TPE",
  "MNL",
  "CEB",
  "BKI",
  "LAX",
  "JFK",
  "CDG",
  "FCO",
  "BCN",
  "IST",
];

const chartColors = [
  { backgroundColor: "rgba(75,192,192,0.2)", borderColor: "rgba(75,192,192,1)" },
  { backgroundColor: "rgba(255,99,132,0.2)", borderColor: "rgba(255,99,132,1)" },
  { backgroundColor: "rgba(54,162,235,0.2)", borderColor: "rgba(54,162,235,1)" },
  { backgroundColor: "rgba(255,206,86,0.2)", borderColor: "rgba(255,206,86,1)" },
  { backgroundColor: "rgba(153,102,255,0.2)", borderColor: "rgba(153,102,255,1)" },
  { backgroundColor: "rgba(255,159,64,0.2)", borderColor: "rgba(255,159,64,1)" },
];