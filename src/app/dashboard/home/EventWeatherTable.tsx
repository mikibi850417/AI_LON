"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    Tooltip,
} from "@mui/material";
import { format, addDays } from "date-fns";
import { ko } from "date-fns/locale";
import { scrollableTableContainerStyle, headerCellStyle, contentCellStyle } from "./tableStyles";
import { alpha } from "@mui/material/styles";
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import UmbrellaIcon from '@mui/icons-material/Umbrella';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import EventIcon from '@mui/icons-material/Event';
import CelebrationIcon from '@mui/icons-material/Celebration';
import TheatersIcon from '@mui/icons-material/Theaters';

// API 기본 URL 가져오기
const getApiBaseUrl = (): string => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// 🌦️ 날씨 상태에 따른 아이콘 매핑
const weatherIcons: { [key: string | number]: React.ReactNode } = {
  1: <WbSunnyIcon sx={{ color: "gold" }} />,
  2: <CloudIcon sx={{ color: "#78909c" }} />,
  3: <CloudIcon sx={{ color: "#455a64" }} />,
  4: <UmbrellaIcon sx={{ color: "skyblue" }} />,
  5: <AcUnitIcon sx={{ color: "lightblue" }} />,
};

// 타입 변환 함수 수정
const convertToNumber = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value) || 0;
    return 0;
};

// 온도에 따른 색상 설정
const getTemperatureColor = (temp: number | string | undefined) => {
    const temperature = convertToNumber(temp);
    if (temperature >= 30) return "#FF5252";
    if (temperature >= 25) return "#FF8A65";
    if (temperature >= 20) return "#FFD54F";
    if (temperature >= 15) return "#81C784";
    if (temperature >= 10) return "#4FC3F7";
    if (temperature >= 5) return "#7986CB";
    if (temperature >= 0) return "#9575CD";
    return "#7E57C2";
};

// WeatherData 인터페이스 수정
interface WeatherData {
    date: string;
    weather_code: number | string;
    min_temp: number | string;
    max_temp: number | string;
    location_name: string;
    weather?: string;
    temperature?: number;
    precipitation?: number | string;
}

interface HolidayData {
    date: string;
    holiday_name: string;
    country: string;
    holiday_start_date: string;
    holiday_end_date: string;
}

interface PerformanceData {
    pid: string;
    name: string;
    p_date: string;
    venue?: string;
    cast?: string;
}

// FastAPI-style API response interfaces
interface WeatherApiItem {
    date: string;
    weather_code: number;
    min_temp: number;
    max_temp: number;
    location_name: string;
}

interface WeatherApiResponse {
    items?: WeatherApiItem[];
}

interface HolidayApiItem {
    holiday_name: string;
    country: string;
    holiday_start_date: string;
    holiday_end_date?: string;
}

interface HolidayApiResponse {
    items?: HolidayApiItem[];
}

interface PerformanceApiItem {
    pid: string;
    name: string;
    p_date: string;
    venue?: string;
    cast?: string;
}

interface PerformanceApiResponse {
    items?: PerformanceApiItem[];
}

interface EventWeatherTableProps {
    locationCode?: string; // FastAPI의 선택적 파라미터 패턴
    days?: number;
    dates?: string[];
}

export default function EventWeatherTable({ locationCode, days = 7, dates }: EventWeatherTableProps) {
    const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});
    const [holidayData, setHolidayData] = useState<Record<string, HolidayData[]>>({});
    const [performanceData, setPerformanceData] = useState<Record<string, PerformanceData[]>>({});
    const [localDates, setLocalDates] = useState<string[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 부모 컴포넌트에서 dates를 받아오면 사용하고, 아니면 자체적으로 생성
        if (dates && dates.length > 0) {
            setLocalDates(dates);
        } else {
            const today = new Date();
            const newDates = Array.from({ length: days }, (_, i) => format(addDays(today, i), "yyyy-MM-dd"));
            setLocalDates(newDates);
        }
    }, [days, dates]);

    useEffect(() => {
        if (!locationCode || localDates.length === 0) return;

        // 클라이언트 사이드에서만 현재 시간 설정
        setLastUpdated(new Date().toLocaleString('ko-KR'));

        // 날짜 범위 계산 - 수정된 부분
        const today = new Date();
        const start = format(today, "yyyy-MM-dd");
        const end = format(addDays(today, days - 1), "yyyy-MM-dd"); // days 값에 따라 종료일 계산

        // 날씨 데이터 가져오기
        const fetchWeather = async () => {
            try {
                // location_code 값을 사용하여 날씨 데이터 가져오기
                const url = `${getApiBaseUrl()}/api/weather/?start_date=${start}&end_date=${end}&region=${locationCode}`;
                console.log(`날씨 API 호출: ${url}`); // 디버깅용 로그 추가

                const res = await fetch(url);
                if (!res.ok) {
                    throw new Error(`API 응답 오류: ${res.status}`);
                } const result: WeatherApiResponse | WeatherApiItem[] = await res.json();
                console.log("날씨 데이터 응답:", result); // 디버깅용 로그 추가

                const weatherMap: Record<string, WeatherData> = {};

                // API 응답 구조에 따라 데이터 처리 방식 수정
                if ('items' in result && Array.isArray(result.items)) {
                    result.items.forEach((item: WeatherApiItem) => {
                        // 날짜 형식 확인 및 처리
                        const date = item.date?.slice(0, 10);
                        if (date) {
                            weatherMap[date] = {
                                date,
                                weather_code: item.weather_code || 2,
                                min_temp: item.min_temp || 0,
                                max_temp: item.max_temp || 0,
                                location_name: item.location_name || "서울특별시"
                            };
                        }
                    });
                } else if (Array.isArray(result)) {
                    // 배열 형태로 응답이 오는 경우
                    result.forEach((item: WeatherApiItem) => {
                        const date = item.date?.slice(0, 10);
                        if (date) {
                            weatherMap[date] = {
                                date,
                                weather_code: item.weather_code || 2,
                                min_temp: item.min_temp || 0,
                                max_temp: item.max_temp || 0,
                                location_name: item.location_name || "서울특별시"
                            };
                        }
                    });
                }

                // console.log("가공된 날씨 데이터:", weatherMap);
                setWeatherData(weatherMap);
            } catch (e) {
                console.error("날씨 데이터 로드 실패", e);
                setError("날씨 데이터를 불러오는 중 오류가 발생했습니다.");
            }
        };

        // 공휴일 데이터 가져오기
        const fetchHolidays = async () => {
            try {
                const url = `${getApiBaseUrl()}/api/holidays/?start_date=${start}&end_date=${end}`;
                console.log(`공휴일 API 호출: ${url}`); // 디버깅용 로그 추가

                const res = await fetch(url);
                const rawText = await res.text();
                // console.log("공휴일 응답 상태:", res.status, rawText);

                if (res.status === 204) {
                    // 휴일이 없는 정상 상황
                    setHolidayData({});
                    return;
                }

                if (!res.ok) {
                    console.error(`Holiday API 오류: ${res.status}`);
                    setHolidayData({}); // 오류 시에도 빈 객체 설정
                    return; // 오류 시 여기서 함수 종료
                } try {
                    const result: HolidayApiResponse | HolidayApiItem[] | Record<string, HolidayApiItem[]> = rawText ? JSON.parse(rawText) : {};
                    const holidayMap: Record<string, HolidayData[]> = {};

                    const addHoliday = (item: HolidayApiItem) => {
                        if (!item || !item.holiday_start_date) return; // 유효하지 않은 항목 건너뛰기

                        try {
                            // 시작일과 종료일 사이의 모든 날짜에 휴일 정보 추가
                            const startDate = new Date(item.holiday_start_date);
                            const endDate = new Date(item.holiday_end_date || item.holiday_start_date);

                            // 유효한 날짜인지 확인
                            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;

                            // 시작일부터 종료일까지 반복
                            const currentDate = new Date(startDate);
                            while (currentDate <= endDate) {
                                const dateStr = format(currentDate, "yyyy-MM-dd");

                                if (!holidayMap[dateStr]) {
                                    holidayMap[dateStr] = [];
                                }

                                holidayMap[dateStr].push({
                                    date: dateStr,
                                    holiday_name: item.holiday_name || "휴일",
                                    country: item.country || "대한민국",
                                    holiday_start_date: item.holiday_start_date,
                                    holiday_end_date: item.holiday_end_date || item.holiday_start_date
                                });

                                // 다음 날짜로 이동
                                currentDate.setDate(currentDate.getDate() + 1);
                            }
                        } catch (err) {
                            console.error("날짜 처리 오류", err);
                            // 개별 항목 처리 오류는 무시하고 계속 진행
                        }
                    };

                    const flatten = (item: HolidayApiItem): HolidayData => {
                        try {
                            return {
                                date: "", // 이 값은 나중에 설정됨
                                holiday_name: item.holiday_name || "휴일",
                                country: item.country || "대한민국",
                                holiday_start_date: item.holiday_start_date || "",
                                holiday_end_date: item.holiday_end_date || item.holiday_start_date || ""
                            };
                        } catch (err) {
                            console.error("항목 변환 오류", err);
                            // 기본값 반환
                            return {
                                date: "",
                                holiday_name: "휴일",
                                country: "대한민국",
                                holiday_start_date: "",
                                holiday_end_date: ""
                            };
                        }
                    };

                    // 안전하게 배열 확인
                    const safeArray = (arr: unknown): HolidayApiItem[] => {
                        return Array.isArray(arr) ? arr : [];
                    };

                    if ('items' in result && Array.isArray(result.items)) {
                        safeArray(result.items).forEach(addHoliday);
                    } else if (Array.isArray(result)) {
                        safeArray(result).forEach(addHoliday);
                    } else if (typeof result === "object" && result !== null && !Array.isArray(result) && !('items' in result)) {
                        Object.entries(result as Record<string, HolidayApiItem[]>).forEach(([d, arr]) => {
                            holidayMap[d] = Array.isArray(arr) ? arr.map((item) => ({
                                ...flatten(item),
                                date: d
                            })) : [];
                        });
                    }

                    // console.log("가공된 공휴일 데이터:", holidayMap);
                    setHolidayData(holidayMap);
                } catch (err) {
                    console.error("Holiday parse error", err);
                    // 파싱 실패해도 화면을 계속 그리도록만 처리
                    setHolidayData({});
                }
            } catch (e) {
                console.error("공휴일 데이터 로드 실패", e);
                // 오류 메시지는 설정하지 않고 빈 데이터만 설정
                setHolidayData({});
            }
        };

        // 공연 데이터 가져오기
        const fetchPerformances = async () => {
            try {
                // API URL 구성 - 대중음악 장르 필터 추가
                const url = `${getApiBaseUrl()}/api/prf/performances?start_date=${start}&end_date=${end}&genre=대중음악`;
                console.log(`공연 API 호출: ${url}`);

                // API 호출
                const res = await fetch(url);

                if (!res.ok) {
                    console.error(`공연 API 오류: ${res.status}`);
                    setPerformanceData({});
                    return;
                }
                const result: PerformanceApiResponse | PerformanceApiItem[] = await res.json();
                console.log("공연 데이터 응답:", result);

                // 데이터 가공
                const performanceMap: Record<string, PerformanceData[]> = {};

                // 응답 구조에 따라 데이터 처리 방식 수정
                if ('items' in result && Array.isArray(result.items)) {
                    // items 배열이 있는 경우
                    result.items.forEach((item: PerformanceApiItem) => {
                        processPerformanceItem(item, performanceMap);
                    });
                } else if (Array.isArray(result)) {
                    // 응답이 바로 배열인 경우
                    result.forEach((item: PerformanceApiItem) => {
                        processPerformanceItem(item, performanceMap);
                    });
                }

                console.log("가공된 공연 데이터:", performanceMap);
                setPerformanceData(performanceMap);
            } catch (err) {
                console.error("공연 데이터 로드 실패", err);
                setPerformanceData({});
            }
        };

        // 공연 데이터 항목 처리 헬퍼 함수
        const processPerformanceItem = (item: PerformanceApiItem, performanceMap: Record<string, PerformanceData[]>) => {
            // p_date 필드에서 날짜 추출 (event_calendar/page.tsx와 일치시킴)
            const date = item.p_date?.slice(0, 10);

            if (date) {
                if (!performanceMap[date]) {
                    performanceMap[date] = [];
                }

                performanceMap[date].push({
                    pid: item.pid || "",
                    name: item.name || "공연 정보 없음",
                    p_date: date,
                    venue: item.venue || "",
                    cast: item.cast || ""
                });
            }
        };

        const fetchAllData = async () => {
            setLoading(true);
            try {
                // 각 API 호출을 개별적으로 처리하여 하나가 실패해도 다른 것은 계속 진행
                await fetchWeather().catch(e => console.error("날씨 데이터 로드 실패", e));
                await fetchHolidays().catch(e => console.error("공휴일 데이터 로드 실패", e));
                await fetchPerformances().catch(e => console.error("공연 데이터 로드 실패", e));
            } catch (e) {
                console.error("데이터 로드 중 오류 발생", e);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [locationCode, localDates, days]); // days 의존성 추가

    // 로딩 상태 표시
    if (loading) {
        return (
            <Box sx={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                background: 'white',
                marginTop: 4,
                p: 4,
                textAlign: 'center'
            }}>
                <Typography>데이터를 불러오는 중입니다...</Typography>
            </Box>
        );
    }

    // 에러 상태 표시
    if (error) {
        return (
            <Box sx={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                background: 'white',
                marginTop: 4,
                p: 4,
                textAlign: 'center',
                color: 'error.main'
            }}>
                <Typography>{error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            background: 'white',
            marginTop: 4
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
                <Typography variant="h6" sx={{
                    fontWeight: 600,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                        <WbSunnyIcon sx={{ mr: 0.5 }} />
                        <EventIcon />
                    </Box>
                    날씨/이벤트 요약
                </Typography>
            </Box>

            <TableContainer sx={{
                ...scrollableTableContainerStyle,
                maxHeight: '400px',
                '&::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha('#2c3e50', 0.2),
                    borderRadius: '4px',
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: alpha('#2c3e50', 0.05),
                }
            }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{
                            background: 'linear-gradient(90deg, #f5f7ff 0%, #e8eaf6 100%)',
                        }}>
                            <TableCell sx={{
                                ...headerCellStyle,
                                fontSize: '0.95rem',
                                color: '#2c3e50',
                                fontWeight: 700,
                                borderBottom: '2px solid #2c3e50',
                                padding: '16px 24px',
                            }}>항목</TableCell>
                            {localDates.map((date) => {
                                const day = new Date(date);
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                // 공휴일 데이터가 있고 배열 길이가 0보다 크면 공휴일로 간주
                                const isHoliday = holidayData[date] && holidayData[date].length > 0;

                                return (
                                    <TableCell key={date} sx={{
                                        ...contentCellStyle,
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        borderBottom: '2px solid #2c3e50',
                                        padding: '16px 24px',
                                        textAlign: 'center',
                                        '& .MuiTypography-root': {
                                            color: isWeekend || isHoliday ? '#d32f2f !important' : '#2c3e50 !important'
                                        },
                                        '& .MuiTypography-caption': {
                                            color: isWeekend || isHoliday ? '#d32f2f !important' : '#64748b !important'
                                        }
                                    }}>
                                        <Box>
                                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                                {format(day, 'MM-dd', { locale: ko })}
                                            </Typography>
                                            <Typography variant="caption" display="block" sx={{ fontSize: '0.75rem' }}>
                                                {format(day, 'EEE', { locale: ko })}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* 날씨 행 */}
                        <TableRow sx={{
                            '&:hover': {
                                backgroundColor: alpha('#2c3e50', 0.04),
                                transition: 'background-color 0.2s ease'
                            }
                        }}>
                            <TableCell sx={{
                                ...headerCellStyle,
                                padding: '14px 24px',
                                borderLeft: '4px solid #2c3e50',
                                backgroundColor: alpha('#2c3e50', 0.03),
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <WbSunnyIcon sx={{ mr: 1, color: '#FF9800' }} />
                                    날씨
                                </Box>
                            </TableCell>
                            {localDates.map((date) => {
                                const weather = weatherData[date];
                                return (
                                    <TableCell key={date} sx={{
                                        ...contentCellStyle,
                                        padding: '14px 24px',
                                        textAlign: 'center',
                                    }}>
                                        {weather ? (
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                                    {weatherIcons[convertToNumber(weather.weather_code)] || <CloudIcon sx={{ color: "#78909c" }} />}
                                                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                                                        {weather.weather_code === 1 ? '맑음' :
                                                            weather.weather_code === 2 ? '구름많음' :
                                                                weather.weather_code === 3 ? '흐림' :
                                                                    weather.weather_code === 4 ? '비' :
                                                                        weather.weather_code === 5 ? '눈' : '알 수 없음'}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2">
                                                    <span style={{ color: getTemperatureColor(weather.min_temp) }}>{weather.min_temp}°C</span> ~
                                                    <span style={{ color: getTemperatureColor(weather.max_temp) }}>{weather.max_temp}°C</span>
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                정보 없음
                                            </Typography>
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>

                        {/* 공휴일 행 */}
                        <TableRow sx={{
                            '&:hover': {
                                backgroundColor: alpha('#2c3e50', 0.04),
                                transition: 'background-color 0.2s ease'
                            }
                        }}>
                            <TableCell sx={{
                                ...headerCellStyle,
                                padding: '14px 24px',
                                borderLeft: '4px solid #2c3e50',
                                backgroundColor: alpha('#2c3e50', 0.03),
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CelebrationIcon sx={{ mr: 1, color: '#d32f2f' }} />
                                    공휴일
                                </Box>
                            </TableCell>
                            {localDates.map((date) => {
                                const holidays = holidayData[date] || [];
                                return (
                                    <TableCell key={date} sx={{
                                        ...contentCellStyle,
                                        padding: '14px 24px',
                                        textAlign: 'center',
                                    }}>
                                        {holidays.length > 0 ? (
                                            <Box>
                                                {holidays.slice(0, 1).map((holiday, idx) => (
                                                    <Tooltip key={idx} title={`${holiday.holiday_name} (${holiday.country})`}>
                                                        <Chip
                                                            label={holiday.holiday_name}
                                                            color="error"
                                                            size="small"
                                                        />
                                                    </Tooltip>
                                                ))}
                                                {holidays.length > 1 && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                        외 {holidays.length - 1}개
                                                    </Typography>
                                                )}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                -
                                            </Typography>
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>

                        {/* 공연 행 */}
                        <TableRow sx={{
                            '&:hover': {
                                backgroundColor: alpha('#2c3e50', 0.04),
                                transition: 'background-color 0.2s ease'
                            }
                        }}>
                            <TableCell sx={{
                                ...headerCellStyle,
                                padding: '14px 24px',
                                borderLeft: '4px solid #2c3e50',
                                backgroundColor: alpha('#2c3e50', 0.03),
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TheatersIcon sx={{ mr: 1, color: '#9c27b0' }} />
                                    공연/이벤트
                                </Box>
                            </TableCell>
                            {localDates.map((date) => {
                                const performances = performanceData[date] || [];
                                return (
                                    <TableCell key={date} sx={{
                                        ...contentCellStyle,
                                        padding: '14px 24px',
                                        textAlign: 'center',
                                    }}>
                                        {performances.length > 0 ? (
                                            <Tooltip title={`${performances.length}개의 공연/이벤트가 있습니다. 클릭하여 자세히 보기`}>
                                                <Chip
                                                    label={`${performances.length}개 공연`}
                                                    color="secondary"
                                                    size="small"
                                                    icon={<EventIcon />}
                                                    onClick={() => {
                                                        // 이벤트 캘린더 페이지로 이동하면서 선택된 날짜 정보 전달
                                                        window.location.href = `/dashboard/event_calendar?date=${date}`;
                                                    }}
                                                    sx={{ cursor: 'pointer' }}
                                                />
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                예정된 이벤트 없음
                                            </Typography>
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{
                p: 2,
                borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                textAlign: 'right',
                color: '#757575',
                fontSize: '0.8rem'
            }}>
                마지막 업데이트: {lastUpdated}
            </Box>
        </Box>
    );
}
