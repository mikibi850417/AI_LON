// src/app/dashboard/home/HotelPriceChart.tsx
"use client";

import React, { useState } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
} from "recharts";
import { Box, Typography, Checkbox } from "@mui/material";
import { alpha } from "@mui/material/styles";

interface HotelData {
    hotel_name: string;
    date: string;
    min_price: string | number;
}

interface Props {
    data: HotelData[];
    dates: string[];
    myHotelName?: string;
}

interface GroupedData {
    [hotelName: string]: {
        [date: string]: number;
    };
}

interface ChartDataRow {
    date: string;
    [key: string]: string | number;
}

// 차트에 사용할 다양한 색상 배열 - 내 호텔용 특별 색상 추가
const CHART_COLORS = [
    "#e74c3c", // 내 호텔용 빨간색 (첫 번째)
    "#3498db", // 밝은 파란색
    "#e67e22", // 주황색
    "#2ecc71", // 녹색
    "#9b59b6", // 보라색
    "#1abc9c", // 청록색
    "#f1c40f", // 노란색
    "#34495e", // 짙은 남색
    "#16a085", // 틸
    "#d35400", // 진한 주황색
];

export default function HotelPriceChart({ data, dates, myHotelName }: Props) {
    const [showAvgPrice, setShowAvgPrice] = useState(true);
    const [showMaxPrice, setShowMaxPrice] = useState(true);
    const [showMinPrice, setShowMinPrice] = useState(true);

    const groupedData = data.reduce((acc: GroupedData, curr: HotelData) => {
        const { hotel_name, date, min_price } = curr;
        if (!acc[hotel_name]) acc[hotel_name] = {};
        acc[hotel_name][date] = typeof min_price === 'string' ? parseFloat(min_price) : min_price;
        return acc;
    }, {} as GroupedData);

    const chartData = dates.map((date): ChartDataRow => {
        const row: ChartDataRow = { date };
        Object.keys(groupedData).forEach((hotel) => {
            row[hotel] = groupedData[hotel]?.[date] || 0;
        });

        // 각 날짜별 평균, 최고, 최저 가격 계산
        const prices = Object.keys(groupedData)
            .map(hotel => groupedData[hotel]?.[date] || 0)
            .filter(price => price > 0);

        if (prices.length > 0) {
            row['평균 가격'] = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            row['최고 가격'] = Math.max(...prices);
            row['최저 가격'] = Math.min(...prices);
        }

        return row;
    });

    // 필터링된 차트 데이터 계산
    const getFilteredChartData = () => {
        // 내 호텔을 첫 번째로 정렬
        const hotels = Object.keys(groupedData).sort((a, b) => {
            if (a === myHotelName) return -1;
            if (b === myHotelName) return 1;
            return a.localeCompare(b);
        });
        
        const lines = [];

        // 호텔 라인 추가
        hotels.forEach((hotel, index) => {
            const isMyHotel = hotel === myHotelName;
            lines.push(
                <Line
                    key={`hotel-${index}`}
                    type="monotone"
                    dataKey={hotel}
                    stroke={isMyHotel ? "#e74c3c" : CHART_COLORS[(index + 1) % CHART_COLORS.length]}
                    strokeWidth={isMyHotel ? 4 : 2.5} // 내 호텔은 더 굵게
                    dot={{ 
                        r: isMyHotel ? 6 : 4, 
                        strokeWidth: 2, 
                        fill: isMyHotel ? '#e74c3c' : 'white',
                        stroke: isMyHotel ? "#e74c3c" : CHART_COLORS[(index + 1) % CHART_COLORS.length]
                    }}
                    activeDot={{ 
                        r: isMyHotel ? 8 : 6, 
                        strokeWidth: 0,
                        fill: isMyHotel ? '#e74c3c' : CHART_COLORS[(index + 1) % CHART_COLORS.length]
                    }}
                />
            );
        });

        // 통계 라인 추가 (체크박스에 따라)
        if (showAvgPrice) {
            lines.push(
                <Line
                    key="avg-price"
                    type="monotone"
                    dataKey="평균 가격"
                    stroke="#2c3e50"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={false}
                />
            );
        }

        if (showMaxPrice) {
            lines.push(
                <Line
                    key="max-price"
                    type="monotone"
                    dataKey="최고 가격"
                    stroke="#f39c12"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={false}
                />
            );
        }

        if (showMinPrice) {
            lines.push(
                <Line
                    key="min-price"
                    type="monotone"
                    dataKey="최저 가격"
                    stroke="#2ecc71"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={false}
                />
            );
        }

        return lines;
    };

    // 범례 커스터마이징을 위한 함수
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderCustomLegend = (props: any) => {
        const { payload } = props;
        if (!payload) return null;
        
        return (
            <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                justifyContent: 'center', 
                gap: 2, 
                mt: 2 
            }}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {payload.map((entry: any, index: number) => {
                    const isMyHotel = entry.value === myHotelName;
                    return (
                        <Box key={index} sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            backgroundColor: isMyHotel ? alpha('#e74c3c', 0.1) : 'transparent',
                            padding: isMyHotel ? '4px 8px' : '0',
                            borderRadius: isMyHotel ? '8px' : '0',
                            border: isMyHotel ? '1px solid #e74c3c' : 'none',
                        }}>
                            <Box sx={{
                                width: 12,
                                height: 12,
                                backgroundColor: entry.color,
                                borderRadius: '50%'
                            }} />
                            <Typography variant="body2" sx={{ 
                                color: isMyHotel ? '#e74c3c' : '#64748b',
                                fontWeight: isMyHotel ? 'bold' : 'normal',
                                fontSize: '0.85rem'
                            }}>
                                {entry.value}
                                {isMyHotel && (
                                    <Box component="span" sx={{
                                        ml: 0.5,
                                        fontSize: '0.7rem',
                                        backgroundColor: '#e74c3c',
                                        color: 'white',
                                        padding: '1px 4px',
                                        borderRadius: '4px',
                                        fontWeight: 'bold'
                                    }}>
                                        내 호텔
                                    </Box>
                                )}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        );
    };

    return (
        <Box sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            background: 'white',
            marginBottom: 4
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
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                    📈 최저가 변화 추이
                </Typography>
            </Box>

            <Box sx={{ padding: 3 }}>
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
                                color: '#f39c12',
                                '&.Mui-checked': {
                                    color: '#f39c12',
                                },
                            }}
                        />
                        <Typography variant="body2" sx={{ color: '#f39c12' }}>최고 가격</Typography>
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

                <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#64748b' }}
                            axisLine={{ stroke: '#cbd5e1' }}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                const days = ['일', '월', '화', '수', '목', '금', '토'];
                                const dayOfWeek = days[date.getDay()];
                                return `${value.replace(/^2025-/, '')} (${dayOfWeek})`;
                            }}
                        />
                        <YAxis
                            tick={{ fill: '#64748b' }}
                            axisLine={{ stroke: '#cbd5e1' }}
                            tickFormatter={(value) => `₩${value.toLocaleString()}`}
                            width={80}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                border: 'none'
                            }}
                            formatter={(value: number, name: string) => [
                                `₩${value.toLocaleString()}`, 
                                name === myHotelName ? `${name} (내 호텔)` : name
                            ]}
                        />
                        <Legend
                            content={renderCustomLegend}
                        />
                        {getFilteredChartData()}
                    </LineChart>
                </ResponsiveContainer>
            </Box>

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
