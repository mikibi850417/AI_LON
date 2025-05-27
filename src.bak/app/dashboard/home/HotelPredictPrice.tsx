"use client";

import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import CommonHotelPredictPrice, { StatsInfo } from "@/lib/components/HotelPredictPrice";

interface Props {
  data: any[];
  dates: string[];
  userRegion: { location_code: string; region: string } | null;
}

export default function HotelPredictPrice({ data, dates, userRegion }: Props) {
  // 통계 정보 상태 추가
  const [stats, setStats] = useState<StatsInfo>({
    hotels: [],
    hotelCount: 0,
    dateCount: 0,
    avgPrice: null,
    minPrice: null,
    maxPrice: null,
    lastDate: null
  });

  // 데이터에서 통계 정보 계산
  useEffect(() => {
    if (data.length > 0 && dates.length > 0) {
      // 호텔 목록 추출 (중복 제거)
      const hotels = Array.from(new Set(data.map(item => item.hotel_name)));

      // 마지막 날짜 
      const lastDate = dates[dates.length - 1];

      // 마지막 날짜의 가격 데이터
      const lastDatePrices = data
        .filter(item => item.date === lastDate)
        .map(item => parseFloat(item.min_price));

      if (lastDatePrices.length > 0) {
        const avgPrice = lastDatePrices.reduce((sum, price) => sum + price, 0) / lastDatePrices.length;
        const minPrice = Math.min(...lastDatePrices);
        const maxPrice = Math.max(...lastDatePrices);

        setStats({
          hotels,
          hotelCount: hotels.length,
          dateCount: dates.length,
          avgPrice: Math.round(avgPrice),
          minPrice,
          maxPrice,
          lastDate
        });
      } else {
        // 마지막 날짜 데이터가 없으면 전체 데이터 평균으로 계산
        const allPrices = data.map(item => parseFloat(item.min_price));
        const avgPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
        const minPrice = Math.min(...allPrices);
        const maxPrice = Math.max(...allPrices);

        setStats({
          hotels,
          hotelCount: hotels.length,
          dateCount: dates.length,
          avgPrice: Math.round(avgPrice),
          minPrice,
          maxPrice,
          lastDate: dates[dates.length - 1]
        });
      }
    }
  }, [data, dates]);

  // 특정 날짜에 대한 최저가 가져오는 함수
  const getPricesForDate = (date: string): number[] => {
    return data
      .filter((item) => item.date === date)
      .map((item) => parseFloat(item.min_price))
      .sort((a, b) => a - b);
  };

  return (
    <Box sx={{
      mt: 4,
      width: '100%'
    }}>
      <CommonHotelPredictPrice
        dates={dates}
        userRegion={userRegion}
        getPricesForDate={getPricesForDate}
        title="예측된 호텔 가격"
        statsInfo={stats} // 통계 정보 props 추가
      />
    </Box>
  );
}
