"use client";

import React, { useState, useEffect } from "react";
import { Box, TextField, CircularProgress, Typography } from "@mui/material";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";

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
    <Box sx={{ padding: "20px", width: "100%" }}>
      <Typography variant="h4" gutterBottom>
        경쟁 호텔 가격 및 트렌드 (오늘부터 +32일)
      </Typography>
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
        <TextField
          label="시작 날짜"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="종료 날짜"
          type="date"
          value={endDate}
          InputProps={{ readOnly: true }}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {/* PCA 트렌드 차트 (PC1) - 상단에 표시 */}
          <Box sx={{ mb: 5 }}>
            <Typography variant="h5" gutterBottom>
              경쟁 호텔 트렌드 (PCA 기반 PC1)
            </Typography>
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
                    text: "경쟁 호텔 트렌드 (PCA - PC1)",
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

          {/* 개별 호텔 가격 차트 (3열 그리드) */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
            {Object.keys(hotelData).map((hotel, index) => (
              <Box key={index}>
                <Typography variant="h6" gutterBottom>
                  {hotel}
                </Typography>
                <Line
                  data={{
                    labels: hotelData[hotel].dates,
                    datasets: [
                      {
                        label: `가격 변화 (${hotel})`,
                        data: hotelData[hotel].prices,
                        borderColor: `hsl(${index * 60}, 70%, 50%)`,
                        backgroundColor: `hsl(${index * 60}, 70%, 70%)`,
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
                        title: { display: true, text: "평균 객실 가격 (원)" },
                      },
                    },
                  }}
                />
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}