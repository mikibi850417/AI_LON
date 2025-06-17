"use client";

import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Typography, Fab, Tooltip, Dialog, IconButton, Avatar } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import HotelSearchAndMap from "./HotelSearchAndMap";
import HotelDataVisualization from "./HotelDataVisualization";
import HotelPredictPrice from "@/lib/components/HotelPredictPrice";
import { fetchHotelData, buildPivotTableFromEntries, computeLineChartDataAllRows } from "./utils";
import PriceChangeIcon from '@mui/icons-material/PriceChange';

// 타입 정의 (FastAPI 스타일)
interface HotelPriceData {
  hotel_name: string;
  date: string;
  room_price: number;
  site?: string;
  room_type?: string;
}

interface PivotTableRow {
  hotel_name: string;
  hotelName?: string;
  id?: string;
  [date: string]: string | number | null | undefined;
}

interface BarChartDataset {
  label: string;
  data: (number | null)[];
  backgroundColor: string;
  siteLabels?: string[];
}

interface LineChartDataset {
  label: string;
  data: (number | null)[];
  fill: boolean;
  borderDash?: number[];
  borderColor: string;
}

interface BarChartData {
  labels: string[];
  datasets: BarChartDataset[];
}

interface LineChartData {
  labels: string[];
  datasets: LineChartDataset[];
}

interface UserRegion {
  location_code: string;
  region: string;
}

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
  const [tableData, setTableData] = useState<HotelPriceData[]>([]);
  const [pivotTableRows, setPivotTableRows] = useState<PivotTableRow[]>([]);
  const [pivotTableDates, setPivotTableDates] = useState<string[]>([]);
  const [lineChartData, setLineChartData] = useState<LineChartData | null>(null);
  const [chartData, setChartData] = useState<BarChartData | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [userRegion, setUserRegion] = useState<UserRegion | null>(null);
  const [openPredictDialog, setOpenPredictDialog] = useState(false);

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
          // 지도 중심점 설정 - 유효한 숫자인지 확인 후 설정
          const lat = parseFloat(addrInfo.latitude);
          const lng = parseFloat(addrInfo.longitude);

          if (!isNaN(lat) && !isNaN(lng)) {
            setMapCenter({
              lat: lat,
              lng: lng,
            });
          } else {
            console.warn("좌표 변환 오류: 유효하지 않은 위도/경도 값입니다.", addrInfo.latitude, addrInfo.longitude);
          }

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

      let allRows: HotelPriceData[] = [];
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
        data.forEach((item) => datesSet.add(item.date));
        const dates = Array.from(datesSet).sort();

        const sitesSet = new Set<string>();
        data.forEach((item) => {
          if (item.site) sitesSet.add(item.site);
        });
        const sites = Array.from(sitesSet);

        const datasets: BarChartDataset[] = sites.map((site, index) => {
          const siteData = dates.map((date) => {
            const entries = data.filter(
              (item) => item.date === date && item.site === site
            );
            return entries.length > 0 ? Math.min(...entries.map((e) => e.room_price)) : null;
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
          data.forEach((item) => datesSet.add(item.date));
        });
        const dates = Array.from(datesSet).sort();

        const datasets: BarChartDataset[] = hotelData.map((hotelItem, index) => {
          const hotelDataByDate: Record<string, { room_price: number; site: string }> = {};

          hotelItem.data.forEach((item) => {
            const date = item.date;
            if (hotelDataByDate[date]) {
              if (item.room_price < hotelDataByDate[date].room_price) {
                hotelDataByDate[date] = { room_price: item.room_price, site: item.site || '' };
              }
            } else {
              hotelDataByDate[date] = { room_price: item.room_price, site: item.site || '' };
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
            siteLabels: siteLabels,
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
    const hotelRows = pivotTableRows.filter(row => row.id && !['avg', 'max', 'min'].includes(row.id));

    // 선택된 날짜의 가격 데이터 추출 (null이 아닌 값만)
    return hotelRows
      .map(row => {
        const price = row[date];
        return typeof price === 'number' ? price : null;
      })
      .filter((price): price is number => price !== null)
      .sort((a, b) => a - b);
  };

  // 예측 다이얼로그 열기
  const handleOpenPredictDialog = () => {
    setOpenPredictDialog(true);
  };

  // 예측 다이얼로그 닫기
  const handleClosePredictDialog = () => {
    setOpenPredictDialog(false);
  };

  return (
    <Box sx={{
      padding: { xs: '16px', md: '24px' },
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      minHeight: 'calc(100vh - 100px)',
      position: 'relative'  // Floating Button을 위한 position 설정
    }}>
      {/* Header section */}
      <h1 className="text-2xl font-bold mb-4" style={{
        color: '#2c3e50',
        padding: '16px 0',
        borderBottom: '2px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center'
      }}>
        <PriceChangeIcon style={{ marginRight: '8px', color: '#2c3e50' }} />
        Hotel Prices
      </h1>

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
      </Box>

      {/* Floating Action Button - 가격 조회 결과가 있을 때만 표시 */}
      {pivotTableRows.length > 0 && pivotTableDates.length > 0 && (
        <Tooltip
          title="AI 가격 예측"
          placement="left"
          componentsProps={{
            tooltip: {
              sx: {
                fontSize: '1.2rem',
                padding: '8px 12px',
                backgroundColor: 'rgba(44, 62, 80, 0.9)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                transform: 'translateY(-5px)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }
            }
          }}
        >
          <Fab
            color="primary"
            aria-label="add"
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              backgroundColor: '#2c3e50',
              backgroundImage: 'linear-gradient(135deg, #2c3e50 0%, #1a2530 100%)',
              '&:hover': {
                backgroundImage: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
                transform: 'scale(1.05) rotate(5deg)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3), 0 6px 12px rgba(44, 62, 80, 0.4)'
              },
              width: 128,
              height: 128,
              boxShadow: '0 6px 20px rgba(0,0,0,0.2), 0 3px 8px rgba(44, 62, 80, 0.3)',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { boxShadow: '0 0 0 0 rgba(44, 62, 80, 0.7)' },
                '70%': { boxShadow: '0 0 0 15px rgba(44, 62, 80, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(44, 62, 80, 0)' }
              }
            }}
            onClick={handleOpenPredictDialog}
          >
            <Avatar
              sx={{
                width: 120,
                height: 120,
                backgroundColor: 'transparent',
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-10px)' },
                  '100%': { transform: 'translateY(0px)' }
                }
              }}
            >
              <Image
                src="/webicon.png"
                alt="예측 아이콘"
                width={120}
                height={120}
                style={{
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                  transition: 'all 0.3s ease'
                }}
              />
            </Avatar>
          </Fab>
        </Tooltip>
      )}

      {/* 예측된 호텔 가격 다이얼로그 */}
      <Dialog
        open={openPredictDialog}
        onClose={handleClosePredictDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            padding: { xs: '16px', sm: '24px' },
            position: 'relative',
            backgroundColor: '#f8fafc',
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15), 0 15px 25px rgba(49, 130, 206, 0.1)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            overflow: 'hidden',
            maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
            margin: { xs: '16px', sm: '32px' },
            width: { xs: 'calc(100% - 32px)', sm: 'auto' }
          }
        }}
      >
        <IconButton
          onClick={handleClosePredictDialog}
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 16 },
            top: { xs: 8, sm: 16 },
            color: '#64748b',
            backgroundColor: 'rgba(226, 232, 240, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(226, 232, 240, 0.8)',
              color: '#2c3e50'
            },
            zIndex: 10
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{
          mt: { xs: 1, sm: 2 },
          mb: { xs: 2, sm: 4 },
          overflowY: 'auto',
          maxHeight: { xs: 'calc(100vh - 120px)', sm: 'calc(100vh - 180px)' },
          '&::-webkit-scrollbar': {
            display: 'none'  // 웹킷 기반 브라우저에서 스크롤바 숨김
          },
          scrollbarWidth: 'none',  // Firefox에서 스크롤바 숨김
          msOverflowStyle: 'none',  // IE에서 스크롤바 숨김
        }}>
          <HotelPredictPrice
            dates={pivotTableDates}
            userRegion={userRegion}
            getPricesForDate={getPricesFromPivotTable}
            title="L.O.N Price Insight"
          />
        </Box>
      </Dialog>
    </Box>
  );
}
