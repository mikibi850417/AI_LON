"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  TextField,
  CircularProgress,
  Button,
  Chip,
  Autocomplete,
  Tabs,
  Tab,
  Typography,
  IconButton,
  Tooltip,
  Checkbox,
} from "@mui/material";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { Bar, Line } from "react-chartjs-2";
import { DataGrid, GridRenderCellParams } from "@mui/x-data-grid";
import { supabase } from "@/lib/supabaseClient";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TableChartIcon from "@mui/icons-material/TableChart";

// 추가: Chart.js 모듈과 필요한 스케일, 요소 등록
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

// Chart.js 등록
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

// Chart.js 기본 설정 추가
ChartJS.defaults.color = '#333';
ChartJS.defaults.font.family = "'Noto Sans KR', 'Helvetica', 'Arial', sans-serif";
ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(255, 255, 255, 0.9)';
ChartJS.defaults.plugins.tooltip.titleColor = '#2c3e50';
ChartJS.defaults.plugins.tooltip.bodyColor = '#2c3e50';
ChartJS.defaults.plugins.tooltip.borderColor = 'rgba(0, 0, 0, 0.1)';
ChartJS.defaults.plugins.tooltip.borderWidth = 1;

// 지도 크기 및 기본 설정
const mapContainerStyle = { width: "100%", height: "600px" };
const defaultCenter = { lat: 37.5665, lng: 126.9780 };

// 날짜 유틸 함수
const getTodayDate = () => new Date().toISOString().split("T")[0];
const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};
const getMinEndDate = (startDate: string) => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

// libraries 배열 (Google Places API)
const libraries: ("places")[] = ["places"];

// google.maps.MapMouseEvent 확장 타입 (placeId 옵션 포함)
interface CustomMapMouseEvent extends google.maps.MapMouseEvent {
  placeId?: string;
}

// API 베이스 URL
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
};

// 가격 조회 API 함수 (크롤링 결과)
const fetchHotelData = async (
  hotelNames: string[],
  start: string,
  end: string
) => {
  const API_BASE = getApiBaseUrl();
  const requests = hotelNames.map(async (hotelName) => {
    // 종료날짜를 포함하기 위해 명시적으로 include_end_date=true 파라미터 추가
    const url = `${API_BASE}/api/hotels/google_crawl?hotel_names=${encodeURIComponent(
      hotelName
    )}&start_date=${start}&end_date=${end}&include_end_date=true`;
    console.log("API 요청 URL:", url); // 디버깅용 로그 추가
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store" // 캐시 사용 안 함
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    console.log("API 응답 데이터:", json); // 응답 데이터 로깅
    let priceData: any[] = [];
    if (json[hotelName]) {
      priceData = json[hotelName];
    } else if (json.data) {
      priceData = json.data;
    } else if (Array.isArray(json)) {
      priceData = json;
    }
    return { hotelName, data: priceData };
  });
  return Promise.all(requests);
};

/**
 * 피벗 테이블 생성 함수
 * - data: API에서 받아온 개별 가격 데이터 배열 (각 행: { hotel_name, date, room_price, ... })
 * - 각 호텔별로 날짜별 최저가격(사이트 무관)을 계산하고,
 *   마지막 3행에는 각 날짜별 평균, 최대, 최솟값을 추가합니다.
 */
function buildPivotTableFromEntries(data: any[]): { pivotRows: any[]; dates: string[] } {
  const hotels = Array.from(new Set(data.map((entry) => entry.hotel_name)));
  const datesSet = new Set<string>();
  data.forEach((entry) => datesSet.add(entry.date));
  const dates = Array.from(datesSet).sort();

  const pivotRows = hotels.map((hotel) => {
    const row: any = { id: hotel, hotelName: hotel };
    dates.forEach((date) => {
      const entries = data.filter(
        (entry) => entry.hotel_name === hotel && entry.date === date
      );
      row[date] = entries.length > 0 ? Math.min(...entries.map((e) => e.room_price)) : null;
    });
    return row;
  });

  const avgRow: any = { id: "avg", hotelName: "평균 가격" };
  const maxRow: any = { id: "max", hotelName: "최고 가격" };
  const minRow: any = { id: "min", hotelName: "최저 가격" };

  dates.forEach((date) => {
    const values = pivotRows.map((row) => row[date]).filter((v) => v !== null);
    if (values.length > 0) {
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      avgRow[date] = Math.round(avg);
      maxRow[date] = Math.max(...values);
      minRow[date] = Math.min(...values);
    } else {
      avgRow[date] = null;
      maxRow[date] = null;
      minRow[date] = null;
    }
  });

  pivotRows.push(avgRow, maxRow, minRow);
  return { pivotRows, dates };
}

/**
 * Line 차트 데이터 생성 함수 (피벗 테이블의 모든 행 포함)
 * - 각 호텔별 최저가와 통계 행(평균, 최대, 최솟값)을 개별 데이터셋으로 생성합니다.
 */
function computeLineChartDataAllRows(pivotRows: any[], dates: string[]) {
  const datasets = pivotRows.map((row, idx) => {
    // 통계 행에 대한 특별 색상 지정
    let color;
    if (row.hotelName === '평균 가격') color = '#2c3e50';
    else if (row.hotelName === '최고 가격') color = '#e74c3c';
    else if (row.hotelName === '최저 가격') color = '#2ecc71';
    else color = `hsl(${(idx * 60) % 360}, 70%, 50%)`;

    return {
      label: row.hotelName,
      data: dates.map((date) => row[date]),
      fill: false,
      // 통계 행은 점선 처리
      borderDash:
        row.id === "avg" || row.id === "max" || row.id === "min" ? [5, 5] : undefined,
      borderColor: color,
    };
  });
  return { labels: dates, datasets };
}

// PivotTableDataGrid 컴포넌트 수정 - favoriteHotels를 props로 받도록 변경
const PivotTableDataGrid = ({
  pivotTableRows,
  pivotTableDates,
  favoriteHotels = [] // 기본값으로 빈 배열 설정
}: {
  pivotTableRows: any[];
  pivotTableDates: string[];
  favoriteHotels?: string[];
}) => {
  const columns = [
    { field: "hotelName", headerName: "호텔명", width: 150 },
    ...pivotTableDates.map((date) => ({
      field: date,
      headerName: date,
      width: 120,
    })),
  ];

  // 전체 너비 계산: 호텔명 열(150px) + 날짜 열들(각 120px)
  const totalWidth = 150 + pivotTableDates.length * 120;

  return (
    <Box sx={{ mt: 3, overflowX: "auto" }}>
      <Typography variant="h6" gutterBottom>
        피벗 테이블 DataGrid
      </Typography>
      {/* DataGrid의 width를 totalWidth로 설정하면 가로 스크롤바가 자연스럽게 활성화됩니다. */}
      <Box sx={{ width: totalWidth }}>
        <DataGrid
          autoHeight
          rows={pivotTableRows}
          columns={[
            {
              field: "hotelName",
              headerName: "호텔명",
              width: 150,
              renderCell: (params: GridRenderCellParams) => {
                const isStatRow = ['평균 가격', '최고 가격', '최저 가격'].includes(params.value as string);
                const value = params.value as string;
                let borderColor = '';

                if (value === '평균 가격') borderColor = '#2c3e50';
                else if (value === '최고 가격') borderColor = '#e74c3c';
                else if (value === '최저 가격') borderColor = '#2ecc71';

                return (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    ...(isStatRow && {
                      borderLeft: `4px solid ${borderColor}`,
                      pl: 1,
                      fontWeight: 'bold',
                      color: borderColor
                    })
                  }}>
                    {value}
                    {favoriteHotels.includes(value) && !isStatRow && (
                      <FavoriteIcon
                        fontSize="small"
                        color="error"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                );
              }
            },
            ...pivotTableDates.map((date) => ({
              field: date,
              headerName: date,
              width: 120,
              renderCell: (params: GridRenderCellParams) => {
                const rowId = params.row.id;
                const isStatRow = ['avg', 'max', 'min'].includes(rowId as string);
                let color = '';

                if (rowId === 'avg') color = '#2c3e50';
                else if (rowId === 'max') color = '#e74c3c';
                else if (rowId === 'min') color = '#2ecc71';

                return (
                  <Box sx={{
                    ...(isStatRow && {
                      fontWeight: 'bold',
                      color: color
                    })
                  }}>
                    {params.value !== null ? `₩${params.value.toLocaleString()}` : '-'}
                  </Box>
                );
              }
            })),
          ]}
          hideFooter={true}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'rgba(44, 62, 80, 0.05)',
              borderBottom: '2px solid #2c3e50',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
              color: '#2c3e50',
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(44, 62, 80, 0.04)',
              transition: 'background-color 0.2s ease'
            },
            '& .MuiDataGrid-row:nth-of-type(even)': {
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
            },
            '& .MuiDataGrid-footerContainer': {
              display: 'none',
            }
          }}
        />
      </Box>
    </Box>
  );
};

// 탭 패널 컴포넌트
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`hotel-tabpanel-${index}`}
      aria-labelledby={`hotel-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
    </div>
  );
}

// 차트 색상 배열 추가
const CHART_COLORS = [
  "#3498db", // 밝은 파란색
  "#e67e22", // 주황색
  "#2ecc71", // 녹색
  "#9b59b6", // 보라색
  "#e74c3c", // 빨간색
  "#1abc9c", // 청록색
  "#f1c40f", // 노란색
  "#34495e", // 짙은 남색
  "#16a085", // 틸
  "#d35400", // 진한 주황색
];

export default function CompetitiveHotelPrice() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [favoriteHotels, setFavoriteHotels] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: getTodayDate(),
    end: getTomorrowDate(),
  });
  // Bar 차트용 데이터
  const [chartData, setChartData] = useState<any>(null);
  // API에서 받아온 개별 가격 데이터 배열
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [tabValue, setTabValue] = useState(0);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  // 피벗 테이블 및 Line 차트 데이터 (하단 영역)
  const [pivotTableRows, setPivotTableRows] = useState<any[]>([]);
  const [pivotTableDates, setPivotTableDates] = useState<string[]>([]);
  const [lineChartData, setLineChartData] = useState<any>(null);

  // 호텔 검색 상태
  const [searchValue, setSearchValue] = useState<string>("");
  const [searchResults, setSearchResults] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // 차트 표시 옵션 상태 추가
  const [showAvgPrice, setShowAvgPrice] = useState(true);
  const [showMaxPrice, setShowMaxPrice] = useState(true);
  const [showMinPrice, setShowMinPrice] = useState(true);

  // 데이터 표시 탭 상태 추가
  const [dataDisplayTab, setDataDisplayTab] = useState(0);

  // 차트 참조 추가
  const lineChartRef = useRef<any>(null);

  // 차트 데이터 변경 시 차트 업데이트
  useEffect(() => {
    if (lineChartRef.current && lineChartData) {
      lineChartRef.current.update();
    }
  }, [lineChartData, showAvgPrice, showMaxPrice, showMinPrice]);

  // 사용자 데이터 가져오기 (Supabase)
  useEffect(() => {
    const fetchUserData = async () => {
      setLoadingFavorites(true);
      try {
        // 1) 현재 로그인된 사용자 ID 조회
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error("사용자 인증 오류:", authError);
          return;
        }
        const userId = user.id;

        // 2) user_address_info 테이블에서 위도/경도 조회
        const { data: addrInfo, error: addrError } = await supabase
          .from("user_address_info")
          .select("latitude, longitude")
          .eq("user_id", userId)
          .single();
        if (addrError) {
          console.error("주소 정보 조회 오류:", addrError);
        } else if (addrInfo) {
          setMapCenter({
            lat: parseFloat(addrInfo.latitude),
            lng: parseFloat(addrInfo.longitude),
          });
        }

        // 3) users 테이블에서 즐겨찾기 목록 조회
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("favorite_hotels")
          .eq("id", userId)
          .single();
        if (userError) {
          console.error("즐겨찾기 조회 오류:", userError);
        } else if (userData?.favorite_hotels) {
          setFavoriteHotels(userData.favorite_hotels);
        }
      } catch (e) {
        console.error("사용자 데이터 조회 중 예외 발생:", e);
      } finally {
        setLoadingFavorites(false);
      }
    };

    fetchUserData();
  }, []);
  // tableData 업데이트 시 피벗 테이블 및 Line 차트 데이터 생성
  useEffect(() => {
    if (tableData.length > 0) {
      const { pivotRows, dates } = buildPivotTableFromEntries(tableData);
      setPivotTableRows(pivotRows);
      setPivotTableDates(dates);
      const lineData = computeLineChartDataAllRows(pivotRows, dates);
      setLineChartData(lineData);
    } else {
      setPivotTableRows([]);
      setPivotTableDates([]);
      setLineChartData(null);
    }
  }, [tableData]);

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 즐겨찾기 토글 함수
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
        console.error("사용자 정보를 가져오는 중 오류 발생:", userError);
        return;
      }
      const { error } = await supabase
        .from("users")
        .update({ favorite_hotels: updatedFavorites })
        .eq("id", user.id)
        .single();
      if (error) {
        console.error("즐겨찾기 업데이트 오류:", error);
        return;
      }
      setFavoriteHotels(updatedFavorites);
    } catch (error) {
      console.error("즐겨찾기 토글 중 오류:", error);
    }
  };

  // 호텔 선택 변경 시 기존 tableData 초기화 (피벗 테이블 재생성)
  useEffect(() => {
    setTableData([]);
  }, [selectedHotels]);

  // Google Maps AutocompleteService 초기화
  useEffect(() => {
    if (isLoaded && window.google) {
      autocompleteRef.current = new google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  // Google Maps PlacesService 초기화
  useEffect(() => {
    if (map) {
      placesServiceRef.current = new google.maps.places.PlacesService(map);
    }
  }, [map]);

  // 호텔 이름 검색 핸들러 (현재 지도 중심 기준 50km 반경)
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    if (value.length > 2 && autocompleteRef.current) {
      autocompleteRef.current.getPlacePredictions(
        {
          input: value,
          types: ["lodging"],
          location: new google.maps.LatLng(mapCenter.lat, mapCenter.lng),
          radius: 50000,
        },
        (predictions, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setSearchResults(predictions);
          } else {
            setSearchResults([]);
          }
        }
      );
    } else {
      setSearchResults([]);
    }
  };

  // 선택된 호텔 상세정보 및 지도 확대 (zoom 20 ≒ 50m)
  const getPlaceDetails = (placeId: string) => {
    if (!placesServiceRef.current) return;
    placesServiceRef.current.getDetails(
      {
        placeId: placeId,
        fields: ["name", "geometry", "types"],
      },
      (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place &&
          place.name &&
          place.geometry?.location
        ) {
          // 타입 안전한 방식으로 호텔 추가
          const hotelName = place.name;
          setSelectedHotels((prev) => {
            if (prev.includes(hotelName)) return prev;
            return [...prev, hotelName];
          });

          setMapCenter({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
          map?.panTo(place.geometry.location);
          map?.setZoom(20);
        }
      }
    );
  };

  // 검색 결과 선택 핸들러
  const handleSearchResultSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (prediction.place_id) {
      getPlaceDetails(prediction.place_id);
    }
    setSearchValue("");
    setSearchResults([]);
  };

  // 가격 조회 API 호출 (원본 Bar 차트용 데이터 및 개별 가격 데이터)
  const handleFetchData = async (
    hotels: string[],
    start: string,
    end: string
  ) => {
    if (hotels.length === 0) {
      setTableData([]);
      return;
    }
    setTableData([]);
    setLoading(true);
    try {
      console.log(`가격 조회 시작: ${start} ~ ${end} (종료일 포함)`);
      const hotelData = await fetchHotelData(hotels, start, end);
      let allRows: any[] = [];
      hotelData.forEach(({ data }) => {
        if (Array.isArray(data)) {
          data.forEach((row: any) => {
            allRows.push(row);
          });
        }
      });
      console.log("수집된 전체 데이터 행 수:", allRows.length);
      console.log("수집된 날짜 목록:", [...new Set(allRows.map(row => row.date))].sort());
      setTableData(allRows);
      // Bar 차트 데이터 생성
      if (hotels.length === 1) {
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
          const hotelDataByDate: Record<string, { room_price: number; site: string }> =
            {};
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
      console.error("가격 데이터 조회 중 오류 발생:", error);
    } finally {
      setLoading(false);
    }
  };

  // Bar 차트 옵션
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false, // 제목 표시 안 함
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
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            if (selectedHotels.length > 1 && context.dataset.siteLabels) {
              const site = context.dataset.siteLabels[context.dataIndex];
              return `${label}: ₩${value.toLocaleString()} (사이트: ${site})`;
            }
            return `${label}: ₩${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "날짜" },
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b'
        }
      },
      y: {
        min: 0,
        title: { display: true, text: "객실 가격 (원)" },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#64748b',
          callback: function (value: any) {
            return '₩' + value.toLocaleString();
          }
        }
      },
    },
  };

  // Line 차트 옵션 수정
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // 추가: 비율 유지 해제
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          font: {
            size: 12
          },
          color: '#333' // 추가: 레전드 텍스트 색상 지정
        }
      },
      title: {
        display: false,
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
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.raw;
            return `${label}: ₩${value?.toLocaleString() || "N/A"}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "날짜", color: '#333' }, // 색상 추가
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b'
        }
      },
      y: {
        min: 0,
        title: { display: true, text: "객실 가격 (원)", color: '#333' }, // 색상 추가
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#64748b',
          callback: function (value: any) {
            return '₩' + value.toLocaleString();
          }
        }
      },
    },
    elements: { // 추가: 요소 스타일 명시적 설정
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
      point: {
        radius: 3,
        hoverRadius: 5,
        backgroundColor: 'white',
        borderWidth: 2,
      }
    },
    animation: {
      duration: 1000 // 애니메이션 시간 설정
    }
  };

  // 호텔 항목 렌더링 (즐겨찾기 아이콘 포함)
  const renderHotelItem = (
    hotel: string,
    isSelected: boolean,
    fromFavorites = false
  ) => {
    const isFavorite = favoriteHotels.includes(hotel);
    return (
      <Box key={hotel} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Chip
          label={hotel}
          variant={isSelected ? "filled" : "outlined"}
          onClick={() => {
            if (!isSelected) {
              setSelectedHotels((prev) => [...prev, hotel]);
            } else {
              setSelectedHotels((prev) => prev.filter((item) => item !== hotel));
            }
          }}
          onDelete={
            !fromFavorites && isSelected
              ? () => handleRemoveHotel(hotel)
              : undefined
          }
          sx={{
            my: 0.5,
            backgroundColor: isSelected ? '#2c3e50' : 'transparent',
            color: isSelected ? "white" : '#2c3e50',
            borderColor: '#2c3e50',
            '&:hover': {
              backgroundColor: isSelected ? '#34495e' : 'rgba(44, 62, 80, 0.1)',
            },
          }}
        />
        <Tooltip title={isFavorite ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}>
          <IconButton
            size="small"
            onClick={() => toggleFavorite(hotel)}
            color={isFavorite ? "error" : "default"}
          >
            {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  // 호텔 제거 핸들러
  const handleRemoveHotel = (hotel: string) => {
    setSelectedHotels((prev) => {
      return prev.filter(item => item !== hotel);
    });
  };

  // 즐겨찾기 호텔 선택 핸들러
  const handleSelectFavoriteHotel = (hotel: string) => {
    setSelectedHotels((prev) => {
      if (prev.includes(hotel)) return prev;
      return [...prev, hotel];
    });
  };

  const handleSelectAllFavorites = () => {
    setSelectedHotels((prev) => Array.from(new Set([...prev, ...favoriteHotels])));
  };

  const handleResetSelection = () => {
    setSelectedHotels([]);
    setTableData([]);
  };

  const handleMapClick = (e: CustomMapMouseEvent) => {
    if (e.placeId) {
      getPlaceDetails(e.placeId);
    }
  };

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  // 필터링된 Bar 차트 데이터 계산 (통계 행 제외)
  const getFilteredBarChartData = () => {
    if (!chartData) return null;

    return {
      ...chartData,
      datasets: chartData.datasets.filter((dataset: any) => {
        // 통계 행은 표시하지 않음
        if (dataset.label === '평균 가격' || dataset.label === '최고 가격' || dataset.label === '최저 가격') {
          return false;
        }
        return true;
      })
    };
  };

  // 필터링된 Line 차트 데이터 계산 (체크박스에 따라 통계 행 필터링)
  const getFilteredLineChartData = () => {
    if (!lineChartData) return null;

    return {
      ...lineChartData,
      datasets: lineChartData.datasets.filter((dataset: any) => {
        // 통계 행 필터링
        if (dataset.label === '평균 가격' && !showAvgPrice) return false;
        if (dataset.label === '최고 가격' && !showMaxPrice) return false;
        if (dataset.label === '최저 가격' && !showMinPrice) return false;
        return true;
      })
    };
  };

  // 날짜 변경 핸들러 수정
  const handleDateChange = (type: "start" | "end", value: string) => {
    if (type === "start") {
      // 시작 날짜가 변경되면 종료 날짜를 자동으로 다음 날로 설정
      const nextDay = new Date(value);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split("T")[0];

      setDateRange({
        start: value,
        end: nextDayStr
      });
    } else {
      setDateRange({
        ...dateRange,
        end: value,
      });
    }
  };

  if (loadError) return <p>🚨 지도 로드 실패</p>;
  if (!isLoaded) return <p>📍 지도를 불러오는 중...</p>;

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
        <PriceChangeIcon style={{ marginRight: '8px', color: '#2c3e50' }} />
        Hotel Prices
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
              <Autocomplete
                freeSolo
                disableClearable
                options={searchResults}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.description
                }
                inputValue={searchValue}
                onInputChange={(_, newValue) => setSearchValue(newValue)}
                onChange={(_, newValue) => {
                  if (typeof newValue === "string") return;
                  if (newValue) {
                    handleSearchResultSelect(newValue);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="호텔 이름으로 검색"
                    fullWidth
                    onChange={handleSearchChange}
                    InputProps={{
                      ...params.InputProps,
                      type: "search",
                    }}
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
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.place_id}>
                    {option.description}
                  </li>
                )}
                sx={{ minWidth: 300 }}
              />

              <TextField
                label="시작 날짜"
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateChange("start", e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />

              <TextField
                label="종료 날짜"
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateChange("end", e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: getMinEndDate(dateRange.start), // 시작 날짜 다음 날부터 선택 가능
                }}
                size="small"
              />

              <Button
                variant="contained"
                color="primary"
                onClick={() => handleFetchData(selectedHotels, dateRange.start, dateRange.end)}
                disabled={selectedHotels.length === 0 || loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                가격 조회
              </Button>

              <Button
                variant="outlined"
                onClick={handleResetSelection}
                sx={{
                  borderColor: '#2c3e50',
                  color: '#2c3e50',
                  '&:hover': {
                    borderColor: '#34495e',
                    backgroundColor: 'rgba(52, 73, 94, 0.05)',
                  },
                  borderRadius: '8px',
                  padding: '8px 16px'
                }}
              >
                초기화
              </Button>
            </Box>
          </Box>
        </Box>

        {/* 지도 및 호텔 선택 영역 */}
        <Box sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          backgroundColor: 'white',
          position: 'relative'
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
              <FavoriteIcon style={{ marginRight: '8px' }} />
              호텔 선택
            </h2>
          </Box>

          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={15}
            center={mapCenter}
            onLoad={onMapLoad}
            onClick={handleMapClick}
            clickableIcons={true}
          />

          {/* 지도 위에 오버랩되는 호텔 목록 패널 */}
          <Box
            sx={{
              position: "absolute",
              top: 70,
              right: 10,
              width: "300px",
              maxHeight: "520px",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: 2,
              boxShadow: 3,
              p: 2,
              overflowY: "auto",
              '&::-webkit-scrollbar': {
                width: '8px',
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
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="hotel tabs"
                variant="fullWidth"
                sx={{
                  minHeight: "40px",
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#2c3e50',
                  },
                  '& .Mui-selected': {
                    color: '#2c3e50',
                    fontWeight: 'bold',
                  },
                }}
              >
                <Tab
                  label="선택된 호텔"
                  id="hotel-tab-0"
                  aria-controls="hotel-tabpanel-0"
                  sx={{ py: 1, minHeight: "40px" }}
                />
                <Tab
                  label="즐겨찾기"
                  id="hotel-tab-1"
                  aria-controls="hotel-tabpanel-1"
                  sx={{ py: 1, minHeight: "40px" }}
                />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {selectedHotels.length > 0 ? (
                  selectedHotels.map((hotel) => renderHotelItem(hotel, true, false))
                ) : (
                  <Typography>선택된 호텔이 없습니다.</Typography>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {loadingFavorites ? (
                <CircularProgress size={20} sx={{ color: '#2c3e50' }} />
              ) : favoriteHotels.length > 0 ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleSelectAllFavorites}
                      sx={{
                        mr: 1,
                        borderColor: '#2c3e50',
                        color: '#2c3e50',
                        '&:hover': {
                          borderColor: '#34495e',
                          backgroundColor: 'rgba(52, 73, 94, 0.05)',
                        },
                      }}
                    >
                      모두 선택
                    </Button>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {favoriteHotels.map((hotel) =>
                      renderHotelItem(hotel, selectedHotels.includes(hotel), true)
                    )}
                  </Box>
                </>
              ) : (
                <Typography>저장된 즐겨찾기 호텔이 없습니다.</Typography>
              )}
            </TabPanel>
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
              지도에서 호텔을 클릭하거나 검색하여 선택하세요
            </span>
            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
              선택된 호텔: {selectedHotels.length}개
            </span>
          </Box>
        </Box>

        {/* 로딩 표시 개선 */}
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

        {/* 데이터 표시 탭 */}
        {(chartData || lineChartData || (pivotTableRows.length > 0 && pivotTableDates.length > 0)) && (
          <Box sx={{ width: '100%', mb: 4 }}>
            <Box sx={{
              borderBottom: 1,
              borderColor: 'divider',
              backgroundColor: 'white',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}>
              <Tabs
                value={dataDisplayTab}
                onChange={(e, newValue) => setDataDisplayTab(newValue)}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    py: 2,
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(44, 62, 80, 0.04)',
                    },
                  },
                  '& .Mui-selected': {
                    color: '#2c3e50 !important',
                    fontWeight: 700,
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#2c3e50',
                    height: 3,
                  }
                }}
              >
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PriceChangeIcon sx={{ mr: 1 }} />
                      호텔별 최저가 비교
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUpIcon sx={{ mr: 1 }} />
                      날짜별 호텔 가격 추세
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TableChartIcon sx={{ mr: 1 }} />
                      호텔 가격 데이터 테이블
                    </Box>
                  }
                />
              </Tabs>
            </Box>

            {/* 탭 패널 */}
            <Box sx={{
              backgroundColor: 'white',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              {/* 호텔별 날짜별 최저가 비교 (Bar 차트) */}
              <TabPanel value={dataDisplayTab} index={0}>
                {chartData && (
                  <Box>
                    <Box sx={{ p: 3, height: '400px' }}>
                      <Bar
                        data={{
                          ...getFilteredBarChartData(),
                          datasets: getFilteredBarChartData()?.datasets.map((dataset: any, index: number) => ({
                            ...dataset,
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                            borderColor: CHART_COLORS[index % CHART_COLORS.length],
                            borderWidth: 1,
                            borderRadius: 4,
                            hoverBackgroundColor: CHART_COLORS[index % CHART_COLORS.length] + 'CC',
                          })) || []
                        }}
                        options={{
                          ...barChartOptions,
                          maintainAspectRatio: false
                        }}
                      />
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
                        각 호텔의 날짜별 최저가를 비교합니다
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        마지막 업데이트: {new Date().toLocaleString('ko-KR')}
                      </span>
                    </Box>
                  </Box>
                )}
              </TabPanel>

              {/* 날짜별 통계 및 호텔 최저가 (Line 차트) */}
              <TabPanel value={dataDisplayTab} index={1}>
                {lineChartData && (
                  <Box>
                    <Box sx={{ p: 3, height: '400px', position: 'relative' }}>
                      {/* 통계 행 표시 옵션 체크박스 추가 */}
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 2,
                        mb: 2,
                        alignItems: 'center'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Checkbox
                            checked={showAvgPrice}
                            onChange={(e) => setShowAvgPrice(e.target.checked)}
                            sx={{
                              color: '#2c3e50',
                              '&.Mui-checked': {
                                color: '#2c3e50',
                              },
                            }}
                          />
                          <Typography variant="body2" sx={{ color: '#2c3e50' }}>평균 가격</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Checkbox
                            checked={showMaxPrice}
                            onChange={(e) => setShowMaxPrice(e.target.checked)}
                            sx={{
                              color: '#e74c3c',
                              '&.Mui-checked': {
                                color: '#e74c3c',
                              },
                            }}
                          />
                          <Typography variant="body2" sx={{ color: '#e74c3c' }}>최고 가격</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Checkbox
                            checked={showMinPrice}
                            onChange={(e) => setShowMinPrice(e.target.checked)}
                            sx={{
                              color: '#2ecc71',
                              '&.Mui-checked': {
                                color: '#2ecc71',
                              },
                            }}
                          />
                          <Typography variant="body2" sx={{ color: '#2ecc71' }}>최저 가격</Typography>
                        </Box>
                      </Box>

                      {lineChartData ? (
                        <Line
                          ref={lineChartRef}
                          data={{
                            labels: lineChartData.labels,
                            datasets: lineChartData.datasets
                              .filter((dataset: any) => {
                                if (dataset.label === '평균 가격' && !showAvgPrice) return false;
                                if (dataset.label === '최고 가격' && !showMaxPrice) return false;
                                if (dataset.label === '최저 가격' && !showMinPrice) return false;
                                return true;
                              })
                              .map((dataset: any) => {
                                // 통계 행에 대한 특별 색상 및 스타일 지정
                                let color;
                                if (dataset.label === '평균 가격') color = '#2c3e50';
                                else if (dataset.label === '최고 가격') color = '#e74c3c';
                                else if (dataset.label === '최저 가격') color = '#2ecc71';
                                else color = `hsl(${(Math.random() * 360).toFixed(0)}, 70%, 50%)`;

                                return {
                                  label: dataset.label,
                                  data: dataset.data,
                                  borderColor: color,
                                  backgroundColor: 'transparent', // 배경색을 투명하게 설정
                                  borderWidth: dataset.label.includes('평균') || dataset.label.includes('최고') || dataset.label.includes('최저') ? 2 : 3,
                                  borderDash: dataset.label.includes('평균') || dataset.label.includes('최고') || dataset.label.includes('최저') ? [5, 5] : [],
                                  pointRadius: dataset.label.includes('평균') || dataset.label.includes('최고') || dataset.label.includes('최저') ? 0 : 3,
                                  pointBackgroundColor: 'white',
                                  pointBorderColor: color,
                                  pointBorderWidth: 2,
                                  tension: 0.4,
                                  fill: false, // 채우기 비활성화
                                };
                              })
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top',
                                labels: {
                                  usePointStyle: true,
                                  boxWidth: 6,
                                  font: {
                                    size: 12
                                  },
                                  color: '#333'
                                }
                              },
                              title: {
                                display: false,
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
                                callbacks: {
                                  label: function (context: any) {
                                    const label = context.dataset.label || "";
                                    const value = context.raw;
                                    return `${label}: ₩${value?.toLocaleString() || "N/A"}`;
                                  },
                                },
                              },
                            },
                            scales: {
                              x: {
                                title: { display: true, text: "날짜", color: '#333' },
                                grid: {
                                  display: false
                                },
                                ticks: {
                                  color: '#64748b'
                                }
                              },
                              y: {
                                min: 0,
                                title: { display: true, text: "객실 가격 (원)", color: '#333' },
                                grid: {
                                  color: 'rgba(0, 0, 0, 0.05)'
                                },
                                ticks: {
                                  color: '#64748b',
                                  callback: function (value: any) {
                                    return '₩' + value.toLocaleString();
                                  }
                                }
                              },
                            },
                            elements: {
                              line: {
                                tension: 0.4,
                                borderWidth: 2,
                              },
                              point: {
                                radius: 3,
                                hoverRadius: 5,
                                backgroundColor: 'white',
                                borderWidth: 2,
                              }
                            },
                            animation: {
                              duration: 1000
                            }
                          }}
                        />
                      ) : (
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '100%',
                          color: '#64748b'
                        }}>
                          데이터가 없습니다
                        </Box>
                      )}
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
                        날짜별 호텔 가격 추세를 확인합니다
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        마지막 업데이트: {new Date().toLocaleString('ko-KR')}
                      </span>
                    </Box>
                  </Box>
                )}
              </TabPanel>

              {/* 호텔 가격 데이터 테이블 */}
              <TabPanel value={dataDisplayTab} index={2}>
                {pivotTableRows.length > 0 && pivotTableDates.length > 0 && (
                  <Box>
                    <Box sx={{ p: 3, height: '400px', overflowY: 'auto' }}>
                      {/* favoriteHotels 전달 */}
                      <PivotTableDataGrid
                        pivotTableRows={pivotTableRows}
                        pivotTableDates={pivotTableDates}
                        favoriteHotels={favoriteHotels}
                      />
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
                        호텔별 날짜별 가격 데이터를 표로 확인합니다
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        마지막 업데이트: {new Date().toLocaleString('ko-KR')}
                      </span>
                    </Box>
                  </Box>
                )}
              </TabPanel>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}