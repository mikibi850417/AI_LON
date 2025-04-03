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
} from "@mui/material";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { Bar, Line } from "react-chartjs-2";
import { DataGrid } from "@mui/x-data-grid";
import { supabase } from "@/lib/supabaseClient";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

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
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  LineElement,
  PointElement
);

// 지도 크기 및 기본 설정
const mapContainerStyle = { width: "100%", height: "500px" };
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
    const url = `${API_BASE}/api/hotels/google_crawl?hotel_names=${encodeURIComponent(
      hotelName
    )}&start_date=${start}&end_date=${end}`;
    const response = await fetch(url, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
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

  const avgRow: any = { id: "avg", hotelName: "Average Price" };
  const maxRow: any = { id: "max", hotelName: "Highest Price" };
  const minRow: any = { id: "min", hotelName: "Lowest Price" };

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
    return {
      label: row.hotelName,
      data: dates.map((date) => row[date]),
      fill: false,
      // 통계 행은 점선 처리
      borderDash:
        row.id === "avg" || row.id === "max" || row.id === "min" ? [5, 5] : undefined,
      borderColor: `hsl(${(idx * 60) % 360}, 70%, 50%)`,
    };
  });
  return { labels: dates, datasets };
}
const PivotTableDataGrid = ({
  pivotTableRows,
  pivotTableDates,
}: {
  pivotTableRows: any[];
  pivotTableDates: string[];
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
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
          disableSelectionOnClick
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
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

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

  // 사용자 데이터 가져오기 (Supabase)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingFavorites(true);
        const { data, error } = await supabase
          .from("users")
          .select("hotel_latitude, hotel_longitude, favorite_hotels")
          .single();
        if (error) {
          console.error("Error fetching user data:", error);
          setLoadingFavorites(false);
          return;
        }
        if (data) {
          if (data.hotel_latitude && data.hotel_longitude) {
            setMapCenter({
              lat: parseFloat(data.hotel_latitude),
              lng: parseFloat(data.hotel_longitude),
            });
          }
          if (data.favorite_hotels && Array.isArray(data.favorite_hotels)) {
            setFavoriteHotels(data.favorite_hotels);
          }
        }
        setLoadingFavorites(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
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
          setSelectedHotels((prev) => {
            if (prev.includes(place.name)) return prev;
            return [...prev, place.name];
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
  const handleSearchSelect = (placeId: string) => {
    if (placeId) {
      getPlaceDetails(placeId);
      setSearchValue("");
      setSearchResults([]);
    }
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
      const hotelData = await fetchHotelData(hotels, start, end);
      let allRows: any[] = [];
      hotelData.forEach(({ data }) => {
        if (Array.isArray(data)) {
          data.forEach((row: any) => {
            allRows.push(row);
          });
        }
      });
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
      console.error("Error fetching data:", error);
      alert("데이터 로드에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 기본 Bar 차트 옵션
  const baseChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text:
          selectedHotels.length === 1
            ? "호텔 날짜별 최저가 비교"
            : "호텔별 날짜별 최저가 비교 (최저가 사이트 포함)",
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            if (selectedHotels.length > 1 && context.dataset.siteLabels) {
              const site = context.dataset.siteLabels[context.dataIndex];
              return `${label}: ${value} (사이트: ${site})`;
            }
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: { title: { display: true, text: "날짜" } },
      y: { title: { display: true, text: "객실 가격 (원)" } },
    },
  };

  // Bar 차트 옵션: y축 최소값을 전체 데이터 최솟값의 (최솟값/2) 로 설정
  let computedBarMin = 0;
  if (chartData && chartData.datasets) {
    const allValues = chartData.datasets.flatMap((ds: any) =>
      ds.data.filter((v: any) => v != null)
    );
    if (allValues.length > 0) {
      computedBarMin = Math.min(...allValues);
    }
  }
  const barChartOptions = {
    ...baseChartOptions,
    scales: {
      ...baseChartOptions.scales,
      y: {
        ...baseChartOptions.scales.y,
        min: computedBarMin / 2,
      },
    },
  };

  // Line 차트 옵션
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "날짜별 통계 및 호텔 최저가 (Line 차트)",
      },
    },
    scales: {
      x: { title: { display: true, text: "날짜" } },
      y: { title: { display: true, text: "가격 (원)" } },
    },
  };

  // 호텔 항목 렌더링 (즐겨찾기 아이콘 포함)
  const renderHotelItem = (
    hotel: string,
    isSelected: boolean,
    fromFavorites = false
  ) => {
    const isFavorite = favoriteHotels.includes(hotel);
    return (
      <Box key={hotel} sx={{ display: "flex", alignItems: "center" }}>
        <Chip
          label={hotel}
          variant="filled"
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
            backgroundColor: isSelected ? "primary.main" : "grey.400",
            color: isSelected ? "white" : "black",
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

  const handleRemoveHotel = (hotelName: string) => {
    setSelectedHotels((prev) => prev.filter((name) => name !== hotelName));
  };

  const handleSelectAllFavorites = () => {
    setSelectedHotels((prev) => Array.from(new Set([...prev, ...favoriteHotels])));
  };

  const handleResetSelection = () => {
    setSelectedHotels([]);
    setTableData([]);
  };

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const customEvent = e as CustomMapMouseEvent;
      if (customEvent.placeId) {
        customEvent.stop();
        if (!map) return;
        const service = new google.maps.places.PlacesService(map);
        service.getDetails(
          {
            placeId: customEvent.placeId,
            fields: ["name", "types", "geometry"],
          },
          (place, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              place &&
              place.types &&
              place.name
            ) {
              if (place.types.includes("lodging")) {
                setSelectedHotels((prev) => {
                  if (prev.includes(place.name)) {
                    return prev.filter((name) => name !== place.name);
                  } else {
                    return [...prev, place.name];
                  }
                });
              }
            }
          }
        );
      }
    },
    [map]
  );

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  if (loadError) return <p>🚨 지도 로드 실패</p>;
  if (!isLoaded) return <p>📍 지도를 불러오는 중...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "20px" }}>
      {/* 1행: 선택 및 지도 */}
      <Box sx={{ display: "flex", flexDirection: "row", gap: 3 }}>
        {/* 선택 영역 */}
        <Box sx={{ flex: 1, p: 3 }}>
          <h2>호텔 가격 비교</h2>
          <Box sx={{ mb: 3 }}>
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
                  handleSearchSelect(newValue.place_id);
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
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.place_id}>
                  {option.description}
                </li>
              )}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
            <TextField
              label="시작 날짜"
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({
                  ...dateRange,
                  start: e.target.value,
                  end: getMinEndDate(e.target.value),
                })
              }
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: getTodayDate() }}
            />
            <TextField
              label="종료 날짜"
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: getMinEndDate(dateRange.start) }}
            />
            <Button
              variant="contained"
              onClick={() =>
                handleFetchData(selectedHotels, dateRange.start, dateRange.end)
              }
              sx={{
                height: "56px",
                backgroundColor: "#A5D6A7",
                color: "black",
                fontSize: "1rem",
                px: 2,
                "&:hover": { backgroundColor: "#81C784" },
              }}
            >
              가격 조회
            </Button>
            <Button
              variant="contained"
              onClick={handleResetSelection}
              sx={{
                height: "56px",
                backgroundColor: "#90CAF9",
                color: "black",
                fontSize: "1rem",
                px: 2,
                "&:hover": { backgroundColor: "#64B5F6" },
              }}
            >
              초기화
            </Button>
          </Box>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="hotel tabs">
              <Tab label="선택된 호텔" id="hotel-tab-0" aria-controls="hotel-tabpanel-0" />
              <Tab label="즐겨찾기" id="hotel-tab-1" aria-controls="hotel-tabpanel-1" />
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
              <CircularProgress size={20} />
            ) : favoriteHotels.length > 0 ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSelectAllFavorites}
                    sx={{ mr: 1 }}
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
        {/* 지도 영역 */}
        <Box sx={{ flex: 1, p: 3 }}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={15}
            center={mapCenter}
            onLoad={onMapLoad}
            onClick={handleMapClick}
            clickableIcons={true}
          />
        </Box>
      </Box>

      {/* 2행: 호텔 날짜별 최저가 비교 (Bar 차트) */}
      {loading ? (
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <CircularProgress size={50} />
        </Box>
      ) : chartData ? (
        <Box sx={{ mt: 3, width: "100%"}}>
          <Bar data={chartData} options={barChartOptions} />
        </Box>
      ) : null}

      {/* 3행: 날짜별 통계 및 호텔 최저가 (Line 차트) */}
      {lineChartData ? (
        <Box sx={{ mt: 3, width: "100%", height: 600 }}>
          <Line data={lineChartData} options={lineChartOptions} />
        </Box>
      ) : null}

      {/* 4행: 피벗 테이블 DataGrid */}
      {pivotTableRows.length > 0 && pivotTableDates.length > 0 && (
        <PivotTableDataGrid pivotTableRows={pivotTableRows} pivotTableDates={pivotTableDates} />
      )}
    </div>
  );
}