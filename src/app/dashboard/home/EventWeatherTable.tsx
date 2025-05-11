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

// 날씨 아이콘 가져오기
const getWeatherIcon = (weatherCode: number | null) => {
    if (!weatherCode) return null;

    switch (weatherCode) {
        case 1:
            return <WbSunnyIcon sx={{ color: '#FF9800' }} />;
        case 3:
            return <UmbrellaIcon sx={{ color: '#2196F3' }} />;
        case 4:
            return <AcUnitIcon sx={{ color: '#90CAF9' }} />;
        case 2:
        default:
            return <CloudIcon sx={{ color: '#78909C' }} />;
    }
};

// 온도에 따른 색상 설정
const getTemperatureColor = (temp: number) => {
    if (temp >= 30) return "#FF5252"; // 매우 더움
    if (temp >= 25) return "#FF8A65"; // 더움
    if (temp >= 20) return "#FFD54F"; // 따뜻함
    if (temp >= 15) return "#81C784"; // 쾌적함
    if (temp >= 10) return "#4FC3F7"; // 선선함
    if (temp >= 5) return "#7986CB"; // 쌀쌀함
    if (temp >= 0) return "#9575CD"; // 추움
    return "#7E57C2"; // 매우 추움
};

interface WeatherData {
    date: string;
    weather_code: number;
    min_temp: number;
    max_temp: number;
    location_name: string;
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

export default function EventWeatherTable({ locationCode }: { locationCode: string }) {
    const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});
    const [holidayData, setHolidayData] = useState<Record<string, HolidayData[]>>({});
    const [performanceData, setPerformanceData] = useState<Record<string, PerformanceData[]>>({});
    const [dates, setDates] = useState<string[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!locationCode) {
            console.warn("locationCode가 유효하지 않습니다. API 호출을 건너뜁니다.");
            return; // locationCode가 없으면 API 호출을 건너뜀
        }

        // 클라이언트 사이드에서만 현재 시간 설정
        setLastUpdated(new Date().toLocaleString('ko-KR'));

        const today = new Date();
        const start = format(today, "yyyy-MM-dd");
        const end = format(addDays(today, 6), "yyyy-MM-dd");
        const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(today, i), "yyyy-MM-dd"));
        setDates(weekDates);

        // 날씨 데이터 가져오기 (서울특별시 기준)
        const fetchWeather = async () => {
            try {
                // location_code 값을 사용하여 날씨 데이터 가져오기
                const url = `${getApiBaseUrl()}/api/weather/?start_date=${start}&end_date=${end}&region=${locationCode}`;
                // console.log(`날씨 API 호출: ${url}`);

                const res = await fetch(url);
                if (!res.ok) {
                    throw new Error(`API 응답 오류: ${res.status}`);
                }

                const result = await res.json();
                // console.log("날씨 데이터 응답:", result);

                const weatherMap: Record<string, WeatherData> = {};

                // API 응답 구조에 따라 데이터 처리 방식 수정
                if (result.items && Array.isArray(result.items)) {
                    result.items.forEach((item: any) => {
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
                    result.forEach((item: any) => {
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
                // console.log(`공휴일 API 호출: ${url}`);

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
                }

                try {
                    const result = rawText ? JSON.parse(rawText) : {};
                    const holidayMap: Record<string, HolidayData[]> = {};

                    const addHoliday = (item: any) => {
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

                    const flatten = (item: any): HolidayData => {
                        try {
                            return {
                                date: item.date || "",
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
                    const safeArray = (arr: any): any[] => {
                        return Array.isArray(arr) ? arr : [];
                    };

                    if (result?.items && Array.isArray(result.items)) {
                        safeArray(result.items).forEach(addHoliday);
                    } else if (Array.isArray(result)) {
                        safeArray(result).forEach(addHoliday);
                    } else if (typeof result === "object" && result !== null) {
                        Object.entries(result).forEach(([d, arr]) => {
                            holidayMap[d] = Array.isArray(arr) ? (arr as any[]).map(flatten) : [];
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

        // 공연 데이터 가져오기 (서울특별시 기준, 대중음악 장르만)
        const fetchPerformances = async () => {
            try {
                const url = `${getApiBaseUrl()}/api/prf/performances?start_date=${start}&end_date=${end}&genre=대중음악`;
                // console.log(`공연 API 호출: ${url}`);

                const res = await fetch(url);
                if (!res.ok) {
                    throw new Error(`API 응답 오류: ${res.status}`);
                }

                const result = await res.json();
                // console.log("공연 데이터 응답:", result);

                const performanceMap: Record<string, PerformanceData[]> = {};

                if (Array.isArray(result)) {
                    result.forEach((item: any) => {
                        // p_date 또는 date 필드 확인
                        const date = item.p_date?.slice(0, 10) || item.date?.slice(0, 10);
                        if (date) {
                            if (!performanceMap[date]) {
                                performanceMap[date] = [];
                            }
                            performanceMap[date].push({
                                pid: item.pid || "",
                                name: item.name || "제목 없음",
                                p_date: date,
                                venue: item.venue || "장소 미정",
                                cast: item.cast || ""
                            });
                        }
                    });
                }

                // console.log("가공된 공연 데이터:", performanceMap);
                setPerformanceData(performanceMap);
            } catch (e) {
                console.error("공연 데이터 로드 실패", e);
                setError("공연 데이터를 불러오는 중 오류가 발생했습니다.");
            } finally {
                setLoading(false);
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
    }, [locationCode]); // locationCode가 변경될 때만 useEffect 실행

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
                            {dates.map((date) => {
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
                            {dates.map((date) => {
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
                                                    {getWeatherIcon(weather.weather_code)}
                                                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                                                        {weather.weather_code === 1 ? '맑음' :
                                                            weather.weather_code === 2 ? '흐림' :
                                                                weather.weather_code === 3 ? '비' :
                                                                    weather.weather_code === 4 ? '눈' : '정보 없음'}
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
                            {dates.map((date) => {
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
                            {dates.map((date) => {
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
