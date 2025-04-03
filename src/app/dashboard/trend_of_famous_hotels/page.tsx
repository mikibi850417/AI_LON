"use client";

import React, { useState, useEffect } from "react";
import { Box, TextField, CircularProgress } from "@mui/material";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";

ChartJS.register(...registerables);

// 기본 날짜 결정 함수: 오전 3시 30분 전이면 어제, 이후면 오늘
const getDefaultDate = (): string => {
  const now = new Date();
  if (now.getHours() < 3 || (now.getHours() === 3 && now.getMinutes() < 30)) {
    now.setDate(now.getDate() - 1);
  }
  return now.toISOString().split("T")[0];
};

// API 베이스 URL 가져오기
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
};

export default function HotelPriceTrends() {
  const [date, setDate] = useState(getDefaultDate());
  const [loading, setLoading] = useState(false);
  // hotelData는 각 호텔별로 { dates, prices } 보관
  const [hotelData, setHotelData] = useState<Record<string, { dates: string[]; prices: number[] }>>({});
  // pcaData: PCA 분석 결과 (PC1 트렌드) 보관 (날짜는 yyyy-mm-dd)
  const [pcaData, setPcaData] = useState<{ dates: string[]; pc1: number[] }>({
    dates: [],
    pc1: [],
  });

  // 호텔 가격 데이터 API 호출 (mean 옵션 사용)
  const fetchHotelPrices = async (selectedDate: string) => {
    setLoading(true);
    const API_BASE = getApiBaseUrl();
    try {
      const response = await fetch(`${API_BASE}/api/hotels/db?saved_datetime=${selectedDate}&mean=true`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      // 각 레코드: { hotel_name, price_date, avg_price }
      const groupedData: Record<string, { dates: string[]; prices: number[] }> = {};

      data.forEach((entry: any) => {
        const { hotel_name, price_date, avg_price } = entry;
        if (!groupedData[hotel_name]) {
          groupedData[hotel_name] = { dates: [], prices: [] };
        }
        groupedData[hotel_name].dates.push(price_date);
        groupedData[hotel_name].prices.push(avg_price);
      });

      setHotelData(groupedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("데이터 로드에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 호텔 PCA 데이터 API 호출 (날짜를 yyyy-mm-dd 형식으로 변환)
  const fetchHotelPCA = async (selectedDate: string) => {
    const API_BASE = getApiBaseUrl();
    try {
      // return_df_pca=true, return_df_segments=false 옵션 사용
      const response = await fetch(`${API_BASE}/api/hotels/pca?saved_datetime=${selectedDate}&return_df_pca=true&return_df_segments=false`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      // data.df_pca: 배열 형태 [{ index, PC1, ... }, ...]
      if (data.df_pca && Array.isArray(data.df_pca)) {
        // 날짜를 yyyy-mm-dd로 포맷
        const dates = data.df_pca.map((item: any) => new Date(item.index).toISOString().split("T")[0]);
        const pc1 = data.df_pca.map((item: any) => item.PC1);
        setPcaData({ dates, pc1 });
      }
    } catch (error) {
      console.error("Error fetching PCA data:", error);
    }
  };

  // 날짜 변경 시 데이터 가져오기
  useEffect(() => {
    fetchHotelPrices(date);
    fetchHotelPCA(date);
  }, [date]);

  // 모든 호텔의 날짜가 동일하다고 가정하여, 첫 호텔의 날짜 배열을 x축 라벨로 사용
  const commonLabels =
    Object.keys(hotelData).length > 0
      ? hotelData[Object.keys(hotelData)[0]].dates
      : [];

  return (
    <Box sx={{ padding: "20px", width: "100%" }}>
      <h2>호텔별 가격 변화</h2>
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="조회 날짜"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {/* PCA 트렌드 차트 (PC1) - 상단에 표시 */}
          <Box sx={{ mb: 5 }}>
            <h3>호텔 트렌드 (PCA 기반 PC1)</h3>
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
                    text: "호텔 트렌드 (PCA - PC1)",
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

          {/* 개별 호텔 차트 (3열 그리드) */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
            {Object.keys(hotelData).map((hotel, index) => (
              <Box key={index}>
                <h3>{hotel}</h3>
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