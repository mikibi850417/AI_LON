"use client";

import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import { supabase } from "@/lib/supabaseClient";
import HotelSearchAndMap from "./HotelSearchAndMap";
import HotelDataVisualization from "./HotelDataVisualization";
// HotelPredictPrice를 직접 import 대신 공통 컴포넌트 사용
import HotelPredictPrice from "@/lib/components/HotelPredictPrice";
import { fetchHotelData, buildPivotTableFromEntries, computeLineChartDataAllRows } from "./utils";

// Chart.js registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  LineElement,
  PointElement,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  LineElement,
  PointElement,
  Filler
);

// Chart.js default settings
ChartJS.defaults.color = '#333';
ChartJS.defaults.font.family = "'Noto Sans KR', 'Helvetica', 'Arial', sans-serif";
ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(255, 255, 255, 0.9)';
ChartJS.defaults.plugins.tooltip.titleColor = '#2c3e50';
ChartJS.defaults.plugins.tooltip.bodyColor = '#2c3e50';
ChartJS.defaults.plugins.tooltip.borderColor = 'rgba(0, 0, 0, 0.1)';
ChartJS.defaults.plugins.tooltip.borderWidth = 1;

export default function CompetitiveHotelPrice() {
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [favoriteHotels, setFavoriteHotels] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split("T")[0],
    end: new Date(new Date().setDate(new Date().getDate() + 1))
      .toISOString()
      .split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]);
  const [pivotTableRows, setPivotTableRows] = useState<any[]>([]);
  const [pivotTableDates, setPivotTableDates] = useState<string[]>([]);
  const [lineChartData, setLineChartData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [userRegion, setUserRegion] = useState<{ location_code: string; region: string } | null>(null);

  // Fetch user data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      setLoadingFavorites(true);
      try {
        // 1) Get current logged-in user ID
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error("User authentication error:", authError);
          return;
        }
        const userId = user.id;

        // 2) Get latitude/longitude from user_address_info table
        const { data: addrInfo, error: addrError } = await supabase
          .from("user_address_info")
          .select("latitude, longitude, location_code, region")
          .eq("user_id", userId)
          .single();
        if (addrError) {
          console.error("Address info fetch error:", addrError);
        } else if (addrInfo) {
          // 지도 중심점 설정
          setMapCenter({
            lat: parseFloat(addrInfo.latitude),
            lng: parseFloat(addrInfo.longitude),
          });

          // 지역 정보 설정 (location_code와 region도 함께 가져오기)
          if (addrInfo.location_code && addrInfo.region) {
            console.log("User region info from user_address_info:", {
              location_code: addrInfo.location_code,
              region: addrInfo.region
            });
            setUserRegion({
              location_code: addrInfo.location_code,
              region: addrInfo.region
            });
          }
        }

        // 3) Get favorites list from users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("favorite_hotels")
          .eq("id", userId)
          .single();
        if (userError) {
          console.error("Favorites fetch error:", userError);
        } else if (userData?.favorite_hotels) {
          setFavoriteHotels(userData.favorite_hotels);
        }
      } catch (e) {
        console.error("Exception while fetching user data:", e);
      } finally {
        setLoadingFavorites(false);
      }
    };

    fetchUserData();
  }, []);

  // Create pivot table and line chart data when tableData updates
  useEffect(() => {
    if (tableData.length > 0) {
      const { pivotRows, dates } = buildPivotTableFromEntries(tableData);
      setPivotTableRows(pivotRows);
      setPivotTableDates(dates);
      setLineChartData(computeLineChartDataAllRows(pivotRows, dates));
    } else {
      setPivotTableRows([]);
      setPivotTableDates([]);
      setLineChartData(null);
    }
  }, [tableData]);

  // Reset tableData when hotel selection changes
  useEffect(() => {
    setTableData([]);
  }, [selectedHotels]);

  // Favorite toggle function
  const toggleFavorite = async (hotelName: string) => {
    try {
      let updatedFavorites;
      if (favoriteHotels.includes(hotelName)) {
        updatedFavorites = favoriteHotels.filter((name) => name !== hotelName);
      } else {
        updatedFavorites = [...favoriteHotels, hotelName];
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error getting user info:", userError);
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({ favorite_hotels: updatedFavorites })
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error updating favorites:", error);
        return;
      }

      setFavoriteHotels(updatedFavorites);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Fetch hotel data
  const handleFetchData = async () => {
    if (selectedHotels.length === 0) {
      setTableData([]);
      return;
    }

    setTableData([]);
    setLoading(true);

    try {
      console.log(`Fetching prices: ${dateRange.start} ~ ${dateRange.end} (inclusive)`);
      const hotelData = await fetchHotelData(selectedHotels, dateRange.start, dateRange.end);

      let allRows: any[] = [];
      hotelData.forEach(({ data }) => {
        if (Array.isArray(data)) {
          allRows = [...allRows, ...data];
        }
      });

      console.log("Total data rows collected:", allRows.length);
      console.log("Collected dates:", [...new Set(allRows.map(row => row.date))].sort());
      setTableData(allRows);

      // Generate chart data
      if (selectedHotels.length === 1) {
        const { data } = hotelData[0];
        const datesSet = new Set<string>();
        data.forEach((item: any) => datesSet.add(item.date));
        const dates = Array.from(datesSet).sort();

        const sitesSet = new Set<string>();
        data.forEach((item: any) => sitesSet.add(item.site));
        const sites = Array.from(sitesSet);

        const datasets = sites.map((site, index) => {
          const siteData = dates.map((date) => {
            const entries = data.filter(
              (item: any) => item.date === date && item.site === site
            );
            return entries.length > 0 ? Math.min(...entries.map((e: any) => e.room_price)) : null;
          });
          return {
            label: site,
            data: siteData,
            backgroundColor: `hsl(${index * 60}, 50%, 80%)`,
          };
        });

        setChartData({ labels: dates, datasets });
      } else {
        const datesSet = new Set<string>();
        hotelData.forEach(({ data }) => {
          data.forEach((item: any) => datesSet.add(item.date));
        });
        const dates = Array.from(datesSet).sort();

        const datasets = hotelData.map((hotelItem, index) => {
          const hotelDataByDate: Record<string, { room_price: number; site: string }> = {};

          hotelItem.data.forEach((item: any) => {
            const date = item.date;
            if (hotelDataByDate[date]) {
              if (item.room_price < hotelDataByDate[date].room_price) {
                hotelDataByDate[date] = { room_price: item.room_price, site: item.site };
              }
            } else {
              hotelDataByDate[date] = { room_price: item.room_price, site: item.site };
            }
          });

          const priceData = dates.map((date) =>
            hotelDataByDate[date] ? hotelDataByDate[date].room_price : null
          );

          const siteLabels = dates.map((date) =>
            hotelDataByDate[date] ? hotelDataByDate[date].site : ""
          );

          return {
            label: hotelItem.hotelName,
            data: priceData,
            backgroundColor: `hsl(${index * 60}, 50%, 80%)`,
            siteLabels,
          };
        });

        setChartData({ labels: dates, datasets });
      }
    } catch (error) {
      console.error("Error fetching price data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 피벗 테이블 데이터에서 특정 날짜의 가격 목록 추출 함수
  const getPricesFromPivotTable = (date: string): number[] => {
    if (!pivotTableRows.length) return [];

    // 통계 행(avg, max, min)을 제외한 실제 호텔 행 추출
    const hotelRows = pivotTableRows.filter(row => !['avg', 'max', 'min'].includes(row.id));

    // 선택된 날짜의 가격 데이터 추출 (null이 아닌 값만)
    return hotelRows
      .map(row => row[date])
      .filter(price => price !== null)
      .sort((a, b) => a - b);
  };

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
      {/* Header section */}
      <Typography variant="h4" sx={{
        mb: 4,
        display: "flex",
        alignItems: "center",
        color: '#2c3e50',
        padding: '16px 0',
        borderBottom: '2px solid #e2e8f0'
      }}>
        <PriceChangeIcon sx={{ mr: 1, color: '#2c3e50' }} />
        호텔 가격
      </Typography>

      {/* Main content */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%'
      }}>
        <HotelSearchAndMap
          selectedHotels={selectedHotels}
          setSelectedHotels={setSelectedHotels}
          favoriteHotels={favoriteHotels}
          toggleFavorite={toggleFavorite}
          dateRange={dateRange}
          setDateRange={setDateRange}
          handleFetchData={handleFetchData}
          loading={loading}
          mapCenter={mapCenter}
          setMapCenter={setMapCenter}
          loadingFavorites={loadingFavorites}
        />

        {/* Loading overlay */}
        {loading && (
          <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}>
            <Box sx={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              maxWidth: '400px',
              width: '90%',
            }}>
              <CircularProgress
                size={60}
                thickness={4}
                sx={{
                  color: '#2c3e50',
                  mb: 3
                }}
              />
              <Typography variant="h6" sx={{ mb: 1, color: '#2c3e50', fontWeight: 'bold' }}>
                가격 정보를 조회 중입니다
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center' }}>
                선택하신 호텔들의 최신 가격 정보를 수집하고 있습니다.
                잠시만 기다려주세요.
              </Typography>
              <Box sx={{ mt: 3, width: '100%' }}>
                <Box sx={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#e2e8f0',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      backgroundColor: '#2c3e50',
                      animation: 'loading 1.5s infinite ease-in-out',
                      '@keyframes loading': {
                        '0%': { width: '0%', left: '0%' },
                        '50%': { width: '70%', left: '10%' },
                        '100%': { width: '0%', left: '100%' }
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Data visualization component */}
        {(chartData || lineChartData || (pivotTableRows.length > 0 && pivotTableDates.length > 0)) && (
          <HotelDataVisualization
            chartData={chartData}
            lineChartData={lineChartData}
            pivotTableRows={pivotTableRows}
            pivotTableDates={pivotTableDates}
            selectedHotels={selectedHotels}
            favoriteHotels={favoriteHotels}
          />
        )}

        {/* 공통 HotelPredictPrice 컴포넌트 사용 */}
        {pivotTableRows.length > 0 && pivotTableDates.length > 0 && (
          <HotelPredictPrice
            dates={pivotTableDates}
            userRegion={userRegion}
            getPricesForDate={getPricesFromPivotTable}
          />
        )}
      </Box>
    </Box>
  );
}
