'use client';

import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import 'react-calendar/dist/Calendar.css';
import './CustomCalendar.css';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// 타입 정의
type Performance = {
  name: string;
  p_date: string;
  pid: string;
};

type GroupedEvents = {
  [date: string]: Performance[];
};

type PerformanceDetails = {
  id: string;
  name: string;
  venue: string;
  cast?: string;
};

type Holiday = {
  country: string;
  holiday_name: string;
  holiday_start_date: string;
  holiday_end_date: string;
};

type GroupedHolidays = {
  [date: string]: Holiday[];
};

// 날짜 포맷팅 및 날짜 범위 계산 헬퍼 함수
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getAdjustedDateRange = (year: number, month: number) => {
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const adjustedStartDate = new Date(firstDayOfMonth);
  adjustedStartDate.setDate(firstDayOfMonth.getDate() - 7);
  const adjustedEndDate = new Date(lastDayOfMonth);
  adjustedEndDate.setDate(lastDayOfMonth.getDate() + 7);
  return {
    start_date: formatDate(adjustedStartDate),
    end_date: formatDate(adjustedEndDate),
  };
};

// 범용 데이터 fetching 함수
const fetchData = async <T,>(url: string): Promise<T | null> => {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      console.error('Failed to fetch data:', response.status);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};

// 공연 일정 가져오기
const fetchEvents = async (year: number, month: number): Promise<GroupedEvents> => {
  const { start_date, end_date } = getAdjustedDateRange(year, month);
  console.log(`Fetching events from ${start_date} to ${end_date}`);
  const url = `${API_BASE_URL}/api/prf/performances?start_date=${start_date}&end_date=${end_date}&genre=대중음악`;
  const data = await fetchData<Performance[]>(url);
  if (!data) return {};
  return data.reduce((acc, event) => {
    acc[event.p_date] = acc[event.p_date] ? [...acc[event.p_date], event] : [event];
    return acc;
  }, {} as GroupedEvents);
};

// 휴일 정보 가져오기
const fetchHolidays = async (year: number, month: number): Promise<GroupedHolidays> => {
  const { start_date, end_date } = getAdjustedDateRange(year, month);
  console.log(`Fetching holidays from ${start_date} to ${end_date}`);
  const url = `${API_BASE_URL}/api/holidays?start_date=${start_date}&end_date=${end_date}`;
  const data = await fetchData<GroupedHolidays>(url);
  return data || {};
};

// 공연 상세 정보 가져오기 (POST 요청)
const fetchPerformanceDetails = async (performanceIds: string[]): Promise<PerformanceDetails[]> => {
  if (performanceIds.length === 0) return [];
  const url = `${API_BASE_URL}/api/prf/performances/ids`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performance_ids: performanceIds }),
    });
    if (!response.ok) {
      console.error('Failed to fetch performance details:', response.status);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching performance details:', error);
    return [];
  }
};

const EventCalendarGrid = () => {
  const today = new Date();
  const formattedToday = formatDate(today);

  const [groupedEvents, setGroupedEvents] = useState<GroupedEvents>({});
  const [groupedHolidays, setGroupedHolidays] = useState<GroupedHolidays>({});
  const [selectedDate, setSelectedDate] = useState<string>(formattedToday);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1);
  const [performanceDetails, setPerformanceDetails] = useState<PerformanceDetails[]>([]);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [isMonthChanging, setIsMonthChanging] = useState<boolean>(false);

  // 월 변경 시 공연 및 휴일 정보 함께 불러오기
  useEffect(() => {
    async function fetchAndSetData() {
      setIsMonthChanging(true);
      const [events, holidays] = await Promise.all([
        fetchEvents(currentYear, currentMonth),
        fetchHolidays(currentYear, currentMonth),
      ]);
      setGroupedEvents(events);
      setGroupedHolidays(holidays);
      setIsMonthChanging(false);
    }
    fetchAndSetData();
  }, [currentYear, currentMonth]);

  // 선택한 날짜의 공연 상세 정보를 불러오기
  useEffect(() => {
    if (!isMonthChanging && groupedEvents[selectedDate]) {
      loadPerformanceDetails(selectedDate);
    }
  }, [groupedEvents, selectedDate, isMonthChanging]);

  const loadPerformanceDetails = async (dateStr: string) => {
    setPerformanceDetails([]);
    const performances = groupedEvents[dateStr] || [];
    const performanceIds = performances.map((event) => event.pid);
    if (performanceIds.length === 0) return;
    setDetailsLoading(true);
    const details = await fetchPerformanceDetails(performanceIds);
    setPerformanceDetails(details);
    setDetailsLoading(false);
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    setSelectedDate(dateStr);
    setPerformanceDetails([]);
    if (groupedEvents[dateStr]) {
      loadPerformanceDetails(dateStr);
    }
  };

  const handleMonthChange = ({ activeStartDate }: { activeStartDate: Date | null }) => {
    if (activeStartDate) {
      const newYear = activeStartDate.getFullYear();
      const newMonth = activeStartDate.getMonth() + 1;
      if (newYear !== currentYear || newMonth !== currentMonth) {
        setCurrentYear(newYear);
        setCurrentMonth(newMonth);
      }
    }
  };

  const renderTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    const dateStr = formatDate(date);
    const eventCount = groupedEvents[dateStr]?.length || 0;
    const holidayCount = groupedHolidays[dateStr]?.length || 0;
    return (
      <Box className="tile-content">
        {eventCount > 0 && (
          <Box className="event-count">
            {eventCount} 이벤트
          </Box>
        )}
        {holidayCount > 0 && (
          <Box className="holiday-count">
            {holidayCount} 휴일
          </Box>
        )}
      </Box>
    );
  };

  // 선택 날짜의 휴일 정보
  const holidayDetails = groupedHolidays[selectedDate] || [];

  return (
    <Box sx={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '20px' }}>
      {/* 캘린더 영역 */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h4" gutterBottom>
          공연 일정
        </Typography>
        <Calendar
          onClickDay={handleDateClick}
          onActiveStartDateChange={handleMonthChange}
          tileClassName={({ date }) => {
            const dateStr = formatDate(date);
            if (dateStr === formattedToday && dateStr !== selectedDate) return 'today-highlight';
            if (dateStr === selectedDate) return 'selected-date';
            return '';
          }}
          tileContent={renderTileContent}
          className="custom-calendar"
        />
      </Box>
      {/* 공연 및 휴일 상세 정보 영역 */}
      <Paper sx={{ flex: 1, padding: '15px' }}>
        {detailsLoading ? (
          <CircularProgress />
        ) : (
          <>
            {/* 공연 정보 */}
            {performanceDetails.length > 0 && (
              <>
                <Typography variant="h5">{selectedDate}의 공연 목록</Typography>
                {performanceDetails.map((detail) => (
                  <Box key={detail.id} sx={{ marginBottom: '10px' }}>
                    <Typography variant="h6">{detail.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOnIcon color="primary" />
                      <Typography>공연 위치: {detail.venue}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon color="secondary" />
                      <Typography>
                        출연자: {detail.cast && detail.cast.length > 0 ? detail.cast : '출연자 정보 없음'}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </>
            )}
            {/* 휴일 정보 */}
            {holidayDetails.length > 0 && (
              <>
                <Typography variant="h5" sx={{ marginTop: performanceDetails.length > 0 ? 2 : 0 }}>
                  {selectedDate}의 휴일 정보
                </Typography>
                {holidayDetails.map((holiday, idx) => (
                  <Box key={idx} sx={{ marginBottom: '10px' }}>
                    <Typography variant="h6">{holiday.holiday_name}</Typography>
                    <Typography>국가: {holiday.country}</Typography>
                  </Box>
                ))}
              </>
            )}
            {/* 공연과 휴일 정보가 없을 때 */}
            {performanceDetails.length === 0 && holidayDetails.length === 0 && (
              <Typography>해당 날짜에 공연 및 휴일 정보가 없습니다.</Typography>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default EventCalendarGrid;
