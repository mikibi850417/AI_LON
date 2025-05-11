// src/app/dashboard/home/HotelPriceTable.tsx
"use client";

import React, { useState } from "react";
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
import { scrollableTableContainerStyle, headerCellStyle, contentCellStyle } from "./tableStyles";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PriceChangeIcon from '@mui/icons-material/PriceChange';

interface Props {
  data: any[];
  dates: string[];
}

export default function HotelPriceTable({ data, dates }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<number>(7); // 기본값 7일

  const groupedData = data.reduce((acc: any, curr: any) => {
    const { hotel_name, date, min_price } = curr;
    if (!acc[hotel_name]) acc[hotel_name] = {};
    acc[hotel_name][date] = min_price;
    return acc;
  }, {});

  // 가격 변동 계산 함수
  const getPriceChange = (hotel: string, dateIndex: number) => {
    if (dateIndex === 0) return null;
    const currentPrice = parseFloat(groupedData[hotel]?.[dates[dateIndex]]);
    const prevPrice = parseFloat(groupedData[hotel]?.[dates[dateIndex - 1]]);

    if (isNaN(currentPrice) || isNaN(prevPrice) || prevPrice === 0) return null;
    return ((currentPrice - prevPrice) / prevPrice) * 100;
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
              }}>호텔명</TableCell>
              {dates.map((date) => (
                <TableCell key={date} sx={{
                  ...contentCellStyle,
                  fontSize: '0.9rem',
                  color: '#2c3e50',
                  fontWeight: 600,
                  borderBottom: '2px solid #2c3e50',
                  padding: '16px 24px',
                  textAlign: 'center',
                }}>
                  {date.slice(5)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(groupedData).map((hotel) => (
              <TableRow key={hotel} sx={{
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
                }}>{hotel}</TableCell>
                {dates.map((date, index) => {
                  const priceChange = getPriceChange(hotel, index);
                  return (
                    <TableCell key={date} sx={{
                      ...contentCellStyle,
                      padding: '14px 24px',
                      position: 'relative',
                      textAlign: 'right',
                    }}>
                      {groupedData[hotel]?.[date] ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <Typography sx={{
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            color: '#424242'
                          }}>
                            {Number(groupedData[hotel][date]).toLocaleString()}원
                          </Typography>
                          {priceChange !== null && (
                            <Tooltip title={`전일 대비 ${priceChange.toFixed(1)}% ${priceChange > 0 ? '상승' : '하락'}`}>
                              <Box sx={{
                                ml: 1,
                                display: 'flex',
                                alignItems: 'center',
                                color: priceChange > 0 ? '#e74c3c' : '#2ecc71'
                              }}>
                                {priceChange > 0 ?
                                  <TrendingUpIcon fontSize="small" /> :
                                  <TrendingDownIcon fontSize="small" />
                                }
                                <Typography variant="caption" sx={{ ml: 0.5 }}>
                                  {Math.abs(priceChange).toFixed(1)}%
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
            ))}

            {/* 통계 섹션 - 스타일 개선 */}
            <TableRow sx={{
              backgroundColor: alpha('#2c3e50', 0.03),
              borderTop: '2px solid #e0e0e0'
            }}>
              <TableCell sx={{
                fontWeight: 700,
                color: '#2c3e50',
                padding: '16px 24px',
                borderLeft: '4px solid #34495e',
              }}>평균 가격</TableCell>
              {dates.map((date) => {
                const values = Object.keys(groupedData)
                  .map((hotel) => parseFloat(groupedData[hotel]?.[date]))
                  .filter((val) => !isNaN(val));
                const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
                return (
                  <TableCell key={date} sx={{
                    ...contentCellStyle,
                    padding: '16px 24px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: '#2c3e50',
                  }}>
                    {avg !== null ? `${Math.round(avg).toLocaleString()}원` : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            <TableRow sx={{ backgroundColor: alpha('#2c3e50', 0.02) }}>
              <TableCell sx={{
                fontWeight: 700,
                color: '#e74c3c',
                padding: '16px 24px',
                borderLeft: '4px solid #e74c3c',
              }}>최고 가격</TableCell>
              {dates.map((date) => {
                const values = Object.keys(groupedData)
                  .map((hotel) => parseFloat(groupedData[hotel]?.[date]))
                  .filter((val) => !isNaN(val));
                const max = values.length > 0 ? Math.max(...values) : null;
                return (
                  <TableCell key={date} sx={{
                    ...contentCellStyle,
                    padding: '16px 24px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: '#e74c3c',
                  }}>
                    {max !== null ? `${Math.round(max).toLocaleString()}원` : "-"}
                  </TableCell>
                );
              })}
            </TableRow>

            <TableRow sx={{ backgroundColor: alpha('#2c3e50', 0.01) }}>
              <TableCell sx={{
                fontWeight: 700,
                color: '#2ecc71',
                padding: '16px 24px',
                borderLeft: '4px solid #2ecc71',
              }}>최저 가격</TableCell>
              {dates.map((date) => {
                const values = Object.keys(groupedData)
                  .map((hotel) => parseFloat(groupedData[hotel]?.[date]))
                  .filter((val) => !isNaN(val));
                const min = values.length > 0 ? Math.min(...values) : null;
                return (
                  <TableCell key={date} sx={{
                    ...contentCellStyle,
                    padding: '16px 24px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: '#2ecc71',
                  }}>
                    {min !== null ? `${Math.round(min).toLocaleString()}원` : "-"}
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
