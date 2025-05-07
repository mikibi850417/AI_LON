'use client';

import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import { Box, Typography, Paper, CircularProgress, Button, Divider } from '@mui/material';
import 'react-calendar/dist/Calendar.css';
import './CustomCalendar.css';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

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
  const [activeTab, setActiveTab] = useState<'events' | 'holidays'>('events');

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

  // 탭 변경 핸들러
  const handleTabChange = (tab: 'events' | 'holidays') => {
    setActiveTab(tab);
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
      {/* 헤더 섹션 - 대시보드와 일관된 스타일로 변경 */}
      <h1 className="text-2xl font-bold mb-4" style={{ 
        color: '#2c3e50',
        padding: '16px 0',
        borderBottom: '2px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center'
      }}>
        <CalendarTodayIcon style={{ marginRight: '8px', color: '#2c3e50' }} /> 
        Event Calendar
      </h1>
      
      {/* 메인 콘텐츠 영역 */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: '24px',
        width: '100%'
      }}>
        {/* 캘린더 영역 */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          backgroundColor: 'white'
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
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center' }}>
              <EventIcon sx={{ mr: 1 }} />
              공연 일정
            </Typography>
          </Box>
          
          <Box sx={{ 
            position: 'relative',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 3
          }}>
            {isMonthChanging && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 10,
                borderRadius: '12px'
              }}>
                <CircularProgress />
              </Box>
            )}
            <Calendar
              onClickDay={handleDateClick}
              onActiveStartDateChange={handleMonthChange}
              tileClassName={({ date }) => {
                const dateStr = formatDate(date);
                const classes = [];
                if (dateStr === formattedToday) classes.push('today-highlight');
                if (dateStr === selectedDate) classes.push('selected-date');
                if (dateStr === formattedToday && dateStr === selectedDate) classes.push('today-date');
                return classes.join(' ');
              }}
              tileContent={renderTileContent}
              className="custom-calendar"
            />
          </Box>
          
          <Box sx={{ 
            p: 2, 
            borderTop: '1px solid rgba(0, 0, 0, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#1976d2' }}></Box>
                <Typography variant="caption" sx={{ color: '#64748b' }}>이벤트</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#e74c3c' }}></Box>
                <Typography variant="caption" sx={{ color: '#64748b' }}>휴일</Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {currentYear}년 {currentMonth}월
            </Typography>
          </Box>
        </Box>
        
        {/* 공연 및 휴일 상세 정보 영역 */}
        <Box 
          sx={{ 
            flex: 1, 
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            backgroundColor: 'white'
          }}
        >
          <Box sx={{ 
            p: 3, 
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, #2c3e50 0%, #34495e 100%)',
            color: 'white'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
              {selectedDate} 상세 정보
            </Typography>
          </Box>
          
          {/* 탭 버튼 */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            p: 3,
            borderBottom: '1px solid #e2e8f0',
          }}>
            <Button
              variant={activeTab === 'events' ? 'contained' : 'outlined'}
              color="primary"
              startIcon={<EventIcon />}
              onClick={() => handleTabChange('events')}
              sx={{ 
                borderRadius: '8px',
                fontWeight: 500,
                flex: 1,
                backgroundColor: activeTab === 'events' ? '#2c3e50' : 'transparent',
                '&:hover': {
                  backgroundColor: activeTab === 'events' ? '#34495e' : 'rgba(44, 62, 80, 0.04)'
                }
              }}
            >
              공연 목록 ({performanceDetails.length})
            </Button>
            
            <Button
              variant={activeTab === 'holidays' ? 'contained' : 'outlined'}
              color="error"
              startIcon={<BeachAccessIcon />}
              onClick={() => handleTabChange('holidays')}
              sx={{ 
                borderRadius: '8px',
                fontWeight: 500,
                flex: 1,
                backgroundColor: activeTab === 'holidays' ? '#e74c3c' : 'transparent',
                '&:hover': {
                  backgroundColor: activeTab === 'holidays' ? '#c0392b' : 'rgba(231, 76, 60, 0.04)'
                }
              }}
            >
              휴일 정보 ({holidayDetails.length})
            </Button>
          </Box>
          
          {/* 콘텐츠 영역 */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            p: 3,
            maxHeight: { xs: '400px', md: '600px' }
          }}>
            {detailsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#2c3e50' }} />
              </Box>
            ) : (
              <>
                {/* 공연 정보 탭 */}
                {activeTab === 'events' && (
                  <>
                    {performanceDetails.length > 0 ? (
                      <Box>
                        {performanceDetails.map((detail) => (
                          <Box 
                            key={detail.id} 
                            className="event-card"
                            sx={{ 
                              mb: 2,
                              borderLeft: '4px solid #2c3e50',
                              backgroundColor: '#f8fafc',
                              borderRadius: '12px',
                              padding: '16px',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-3px)',
                                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                                backgroundColor: '#fff'
                              }
                            }}
                          >
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 600,
                                mb: 1,
                                color: '#2c3e50'
                              }}
                            >
                              {detail.name}
                            </Typography>
                            
                            <Divider sx={{ my: 1.5, opacity: 0.6 }} />
                            
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              mb: 1
                            }}>
                              <LocationOnIcon 
                                fontSize="small" 
                                sx={{ color: '#3498db' }} 
                              />
                              <Typography variant="body2" sx={{ color: '#34495e' }}>
                                {detail.venue || '장소 정보 없음'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              gap: 1 
                            }}>
                              <PeopleIcon 
                                fontSize="small" 
                                sx={{ color: '#9b59b6', mt: 0.5 }} 
                              />
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  lineHeight: 1.4,
                                  color: '#34495e'
                                }}
                              >
                                {detail.cast && detail.cast.length > 0 ? detail.cast : '출연자 정보 없음'}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          py: 6,
                          color: '#94a3b8'
                        }}
                      >
                        <EventIcon sx={{ fontSize: '3rem', mb: 2, color: '#cbd5e1' }} />
                        <Typography>
                          해당 날짜에 공연 정보가 없습니다.
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
                
                {/* 휴일 정보 탭 */}
                {activeTab === 'holidays' && (
                  <>
                    {holidayDetails.length > 0 ? (
                      <Box>
                        {holidayDetails.map((holiday, idx) => (
                          <Box 
                            key={idx} 
                            className="holiday-card"
                            sx={{ 
                              mb: 2,
                              borderLeft: '4px solid #e74c3c',
                              backgroundColor: '#f8fafc',
                              borderRadius: '12px',
                              padding: '16px',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-3px)',
                                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                                backgroundColor: '#fff'
                              }
                            }}
                          >
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 600,
                                mb: 1,
                                color: '#2c3e50'
                              }}
                            >
                              {holiday.holiday_name}
                            </Typography>
                            
                            <Divider sx={{ my: 1.5, opacity: 0.6 }} />
                            
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                color: '#34495e'
                              }}
                            >
                              <span role="img" aria-label="country" style={{ fontSize: '1.2rem' }}>🌍</span>
                              국가: {holiday.country}
                            </Typography>
                            
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mt: 1,
                                color: '#34495e'
                              }}
                            >
                              <span role="img" aria-label="date" style={{ fontSize: '1.2rem' }}>📅</span>
                              기간: {holiday.holiday_start_date} ~ {holiday.holiday_end_date}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          py: 6,
                          color: '#94a3b8'
                        }}
                      >
                        <BeachAccessIcon sx={{ fontSize: '3rem', mb: 2, color: '#cbd5e1' }} />
                        <Typography>
                          해당 날짜에 휴일 정보가 없습니다.
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </>
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
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {activeTab === 'events' ? '공연 정보' : '휴일 정보'} 조회
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {selectedDate}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default EventCalendarGrid;
