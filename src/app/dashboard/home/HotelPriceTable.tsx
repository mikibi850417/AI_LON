// src/app/dashboard/home/HotelPriceTable.tsx
"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  Tooltip,
  alpha,
}
  from "@mui/material";
import { scrollableTableContainerStyle } from "./tableStyles";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PriceChangeIcon from '@mui/icons-material/PriceChange';

// FastAPI 스타일 인터페이스 정의
interface HotelData {
  hotel_name: string;
  date: string;
  min_price: string | number;
}

interface GroupedData {
  [hotelName: string]: {
    [date: string]: number;
  };
}

interface Props {
  data: HotelData[];
  dates: string[];
  myHotelName?: string;
}

export default function HotelPriceTable({ data, dates, myHotelName }: Props) {
  const groupedData = data.reduce((acc: GroupedData, curr: HotelData) => {
    const { hotel_name, date, min_price } = curr;
    if (!acc[hotel_name]) acc[hotel_name] = {};
    acc[hotel_name][date] = typeof min_price === 'string' ? parseFloat(min_price) : min_price;
    return acc;
  }, {} as GroupedData);

  // 가격 변동 계산 함수
  const getPriceChange = (hotel: string, dateIndex: number): number | null => {
    if (dateIndex === 0) return null;
    const currentPrice = groupedData[hotel]?.[dates[dateIndex]];
    const prevPrice = groupedData[hotel]?.[dates[dateIndex - 1]];

    if (currentPrice == null || prevPrice == null || prevPrice === 0) return null;
    return ((currentPrice - prevPrice) / prevPrice) * 100;
  };

  // 내 호텔과의 가격 차이 계산 함수 추가
  const getPriceDifference = (hotel: string, date: string): { difference: number; percentage: number } | null => {
    if (!myHotelName || hotel === myHotelName) return null;
    
    const hotelPrice = groupedData[hotel]?.[date];
    const myHotelPrice = groupedData[myHotelName]?.[date];
    
    if (hotelPrice == null || myHotelPrice == null || myHotelPrice === 0) return null;
    
    const difference = hotelPrice - myHotelPrice;
    const percentage = (difference / myHotelPrice) * 100;
    
    return { difference, percentage };
  };

  return (
    <Box sx={{
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      background: 'white'
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
          <PriceChangeIcon sx={{ mr: 1 }} />
          경쟁 호텔 가격 분석
        </Typography>
      </Box>

      <TableContainer sx={{
        ...scrollableTableContainerStyle,
        maxHeight: '600px',
        maxWidth: '100%',
        overflowX: 'auto',
        overflowY: 'auto',
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
        <Table sx={{ 
          tableLayout: 'auto',
          width: 'max-content',
          minWidth: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0,
        }}>
          <TableHead>
            <TableRow sx={{
              background: 'linear-gradient(90deg, #f5f7ff 0%, #e8eaf6 100%)',
            }}>
              <TableCell sx={{
                fontSize: '0.95rem',
                color: '#2c3e50',
                fontWeight: 700,
                borderBottom: '2px solid #2c3e50',
                padding: '16px 20px',
                width: '200px',
                minWidth: '200px',
                maxWidth: '200px',
                textAlign: 'left',
                verticalAlign: 'middle',
                position: 'sticky',
                left: 0,
                zIndex: 10,
                backgroundColor: '#f5f7ff !important',
                backgroundImage: 'none !important',
                boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#f5f7ff',
                  zIndex: -1,
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: '1px',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  zIndex: 1,
                }
              }}>호텔명</TableCell>
              {dates.map((date) => {
                const dayOfWeek = new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' });
                return (
                  <TableCell key={date} sx={{
                    fontSize: '0.9rem',
                    color: '#2c3e50',
                    fontWeight: 600,
                    borderBottom: '2px solid #2c3e50',
                    padding: '12px 16px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    width: '140px',
                    minWidth: '140px',
                    whiteSpace: 'nowrap',
                  }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {date.slice(5)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                        ({dayOfWeek})
                      </Typography>
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(groupedData)
              .sort((a, b) => {
                if (a === myHotelName) return -1;
                if (b === myHotelName) return 1;
                return a.localeCompare(b);
              })
              .map((hotel) => {
                const isMyHotel = hotel === myHotelName;
                const stickyBgColor = isMyHotel 
                  ? 'rgba(231, 76, 60, 0.05)' 
                  : 'rgba(44, 62, 80, 0.03)';
                
                return (
                  <TableRow key={hotel} sx={{
                    '&:hover': {
                      backgroundColor: isMyHotel 
                        ? alpha('#e74c3c', 0.08) 
                        : alpha('#2c3e50', 0.04),
                    },
                    backgroundColor: isMyHotel ? alpha('#e74c3c', 0.03) : 'transparent',
                    height: '70px',
                    borderBottom: '1px solid #e0e0e0',
                  }}>
                    <TableCell sx={{
                      padding: '16px 20px',
                      borderLeft: `4px solid ${isMyHotel ? '#e74c3c' : '#2c3e50'}`,
                      fontWeight: isMyHotel ? 'bold' : 'normal',
                      color: isMyHotel ? '#e74c3c' : 'inherit',
                      width: '200px',
                      minWidth: '200px',
                      maxWidth: '200px',
                      textAlign: 'left',
                      verticalAlign: 'middle',
                      position: 'sticky',
                      left: 0,
                      zIndex: 5,
                      backgroundColor: `${stickyBgColor} !important`,
                      backgroundImage: 'none !important',
                      boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: isMyHotel ? '#fff' : '#fff',
                        zIndex: -2,
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: stickyBgColor,
                        zIndex: -1,
                      }
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        height: '100%'
                      }}>
                        <Typography sx={{ 
                          fontSize: '0.9rem',
                          fontWeight: isMyHotel ? 'bold' : 'normal',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '120px',
                          lineHeight: 1.2
                        }}>
                          {hotel}
                        </Typography>
                        {isMyHotel && (
                          <Box sx={{
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            lineHeight: 1,
                            flexShrink: 0,
                          }}>
                            내 호텔
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    {dates.map((date) => {
                      const priceChange = getPriceChange(hotel, dates.indexOf(date));
                      const priceDifference = getPriceDifference(hotel, date);
                      const isMyHotel = hotel === myHotelName;
                      
                      return (
                        <TableCell key={date} sx={{
                          padding: '12px 8px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          backgroundColor: isMyHotel ? alpha('#e74c3c', 0.02) : 'transparent',
                          borderBottom: '1px solid #e0e0e0',
                          height: '70px',
                          width: '140px',
                          minWidth: '140px',
                          whiteSpace: 'nowrap',
                        }}>
                          {groupedData[hotel]?.[date] ? (
                            <Box sx={{ 
                              display: 'flex', 
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.5,
                              height: '100%'
                            }}>
                              <Typography sx={{
                                fontWeight: isMyHotel ? 700 : 600,
                                fontSize: '0.8rem',
                                color: isMyHotel ? '#e74c3c' : '#424242',
                                lineHeight: 1.2,
                                textAlign: 'center'
                              }}>
                                {Number(groupedData[hotel][date]).toLocaleString()}원
                              </Typography>
                              
                              {/* 내 호텔인 경우 전일 대비 변화율 표시 */}
                              {isMyHotel && priceChange !== null && (
                                <Tooltip title={`전일 대비 ${priceChange.toFixed(1)}% ${priceChange > 0 ? '상승' : '하락'}`}>
                                  <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: priceChange > 0 ? '#e74c3c' : '#2ecc71',
                                    fontSize: '0.65rem'
                                  }}>
                                    {priceChange > 0 ?
                                      <TrendingUpIcon sx={{ fontSize: '10px' }} /> :
                                      <TrendingDownIcon sx={{ fontSize: '10px' }} />
                                    }
                                    <Typography variant="caption" sx={{ ml: 0.2, fontSize: '0.65rem' }}>
                                      {Math.abs(priceChange).toFixed(1)}%
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              )}
                              
                              {/* 경쟁 호텔인 경우 내 호텔과의 가격 차이 표시 */}
                              {!isMyHotel && priceDifference !== null && (
                                <Tooltip title={`내 호텔 대비 ${priceDifference.difference > 0 ? '+' : ''}${priceDifference.difference.toLocaleString()}원 (${priceDifference.percentage > 0 ? '+' : ''}${priceDifference.percentage.toFixed(1)}%)`}>
                                  <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: priceDifference.difference > 0 ? '#e74c3c' : '#2ecc71',
                                    fontSize: '0.65rem'
                                  }}>
                                    {priceDifference.difference > 0 ?
                                      <TrendingUpIcon sx={{ fontSize: '10px' }} /> :
                                      <TrendingDownIcon sx={{ fontSize: '10px' }} />
                                    }
                                    <Typography variant="caption" sx={{ ml: 0.2, fontSize: '0.65rem' }}>
                                      {priceDifference.difference > 0 ? '+' : ''}{Math.abs(priceDifference.percentage).toFixed(1)}%
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              )}
                            </Box>
                          ) : (
                            <Typography sx={{ 
                              color: '#9e9e9e', 
                              fontSize: '0.8rem',
                              textAlign: 'center'
                            }}>-</Typography>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}

            {/* 통계 섹션도 동일한 스타일 적용 */}
            <TableRow sx={{
              backgroundColor: alpha('#2c3e50', 0.03),
              borderTop: '2px solid #e0e0e0',
              height: '60px'
            }}>
              <TableCell sx={{
                fontWeight: 700,
                color: '#2c3e50',
                padding: '16px 20px',
                borderLeft: '4px solid #34495e',
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: 'rgba(44, 62, 80, 0.03) !important',
                backgroundImage: 'none !important',
                textAlign: 'left',
                verticalAlign: 'middle',
                boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#fff',
                  zIndex: -2,
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(44, 62, 80, 0.03)',
                  zIndex: -1,
                }
              }}>평균 가격</TableCell>
              {dates.map((date) => {
                const values = Object.keys(groupedData)
                  .map((hotel) => groupedData[hotel]?.[date])
                  .filter((val) => val != null && !isNaN(val));
                const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
                
                const myHotelPrice = myHotelName ? groupedData[myHotelName]?.[date] : null;
                const avgDifference = avg !== null && myHotelPrice !== null && myHotelPrice !== 0 
                  ? ((avg - myHotelPrice) / myHotelPrice) * 100 
                  : null;
                const avgDifferenceAmount = avg !== null && myHotelPrice !== null 
                  ? avg - myHotelPrice 
                  : null;
                
                return (
                  <TableCell key={date} sx={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    fontWeight: 600,
                    color: '#2c3e50',
                    height: '60px',
                    width: '140px',
                    minWidth: '140px',
                  }}>
                    {avg !== null ? (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        height: '100%'
                      }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#2c3e50' }}>
                          {Math.round(avg).toLocaleString()}원
                        </Typography>
                        {avgDifference !== null && avgDifferenceAmount !== null && (
                          <Tooltip title={`내 호텔 대비 ${avgDifferenceAmount > 0 ? '+' : ''}${Math.round(avgDifferenceAmount).toLocaleString()}원 (${avgDifference > 0 ? '+' : ''}${avgDifference.toFixed(1)}%)`}>
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: avgDifference > 0 ? '#e74c3c' : '#2ecc71',
                              fontSize: '0.65rem'
                            }}>
                              {avgDifference > 0 ?
                                <TrendingUpIcon sx={{ fontSize: '10px' }} /> :
                                <TrendingDownIcon sx={{ fontSize: '10px' }} />
                              }
                              <Typography variant="caption" sx={{ ml: 0.2, fontSize: '0.65rem' }}>
                                {avgDifference > 0 ? '+' : ''}{Math.abs(avgDifference).toFixed(1)}%
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
                    ) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            <TableRow sx={{ backgroundColor: alpha('#2c3e50', 0.02), height: '60px' }}>
              <TableCell sx={{
                fontWeight: 700,
                color: '#f39c12',
                padding: '16px 20px',
                borderLeft: '4px solid #f39c12',
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: 'rgba(44, 62, 80, 0.02) !important',
                backgroundImage: 'none !important',
                textAlign: 'left',
                verticalAlign: 'middle',
                boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#fff',
                  zIndex: -2,
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(44, 62, 80, 0.02)',
                  zIndex: -1,
                }
              }}>최고 가격</TableCell>
              {dates.map((date) => {
                const values = Object.keys(groupedData)
                  .map((hotel) => groupedData[hotel]?.[date])
                  .filter((val) => val != null && !isNaN(val));
                const max = values.length > 0 ? Math.max(...values) : null;
                
                const myHotelPrice = myHotelName ? groupedData[myHotelName]?.[date] : null;
                const maxDifference = max !== null && myHotelPrice !== null && myHotelPrice !== 0 
                  ? ((max - myHotelPrice) / myHotelPrice) * 100 
                  : null;
                const maxDifferenceAmount = max !== null && myHotelPrice !== null 
                  ? max - myHotelPrice 
                  : null;
                
                return (
                  <TableCell key={date} sx={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    fontWeight: 600,
                    color: '#f39c12',
                    height: '60px'
                  }}>
                    {max !== null ? (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        height: '100%'
                      }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#f39c12' }}>
                          {Math.round(max).toLocaleString()}원
                        </Typography>
                        {maxDifference !== null && maxDifferenceAmount !== null && (
                          <Tooltip title={`내 호텔 대비 ${maxDifferenceAmount > 0 ? '+' : ''}${Math.round(maxDifferenceAmount).toLocaleString()}원 (${maxDifference > 0 ? '+' : ''}${maxDifference.toFixed(1)}%)`}>
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: maxDifference > 0 ? '#e74c3c' : '#2ecc71',
                              fontSize: '0.7rem'
                            }}>
                              {maxDifference > 0 ?
                                <TrendingUpIcon sx={{ fontSize: '12px' }} /> :
                                <TrendingDownIcon sx={{ fontSize: '12px' }} />
                              }
                              <Typography variant="caption" sx={{ ml: 0.2, fontSize: '0.7rem' }}>
                                {maxDifference > 0 ? '+' : ''}{Math.abs(maxDifference).toFixed(1)}%
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
                    ) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            <TableRow sx={{ backgroundColor: alpha('#2c3e50', 0.01), height: '60px' }}>
              <TableCell sx={{
                fontWeight: 700,
                color: '#2ecc71',
                padding: '16px 20px',
                borderLeft: '4px solid #2ecc71',
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: 'rgba(44, 62, 80, 0.01) !important',
                backgroundImage: 'none !important',
                textAlign: 'left',
                verticalAlign: 'middle',
                boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#fff',
                  zIndex: -2,
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(44, 62, 80, 0.01)',
                  zIndex: -1,
                }
              }}>최저 가격</TableCell>
              {dates.map((date) => {
                const values = Object.keys(groupedData)
                  .map((hotel) => groupedData[hotel]?.[date])
                  .filter((val) => val != null && !isNaN(val));
                const min = values.length > 0 ? Math.min(...values) : null;
                
                const myHotelPrice = myHotelName ? groupedData[myHotelName]?.[date] : null;
                const minDifference = min !== null && myHotelPrice !== null && myHotelPrice !== 0 
                  ? ((min - myHotelPrice) / myHotelPrice) * 100 
                  : null;
                const minDifferenceAmount = min !== null && myHotelPrice !== null 
                  ? min - myHotelPrice 
                  : null;
                
                return (
                  <TableCell key={date} sx={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    fontWeight: 600,
                    color: '#2ecc71',
                    height: '60px'
                  }}>
                    {min !== null ? (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        height: '100%'
                      }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#2ecc71' }}>
                          {Math.round(min).toLocaleString()}원
                        </Typography>
                        {minDifference !== null && minDifferenceAmount !== null && (
                          <Tooltip title={`내 호텔 대비 ${minDifferenceAmount > 0 ? '+' : ''}${Math.round(minDifferenceAmount).toLocaleString()}원 (${minDifference > 0 ? '+' : ''}${minDifference.toFixed(1)}%)`}>
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: minDifference > 0 ? '#e74c3c' : '#2ecc71',
                              fontSize: '0.7rem'
                            }}>
                              {minDifference > 0 ?
                                <TrendingUpIcon sx={{ fontSize: '12px' }} /> :
                                <TrendingDownIcon sx={{ fontSize: '12px' }} />
                              }
                              <Typography variant="caption" sx={{ ml: 0.2, fontSize: '0.7rem' }}>
                                {minDifference > 0 ? '+' : ''}{Math.abs(minDifference).toFixed(1)}%
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
                    ) : "-"}
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
        마지막 업데이트: {new Date().toLocaleString('ko-KR')}
      </Box>
    </Box>
  );
}
