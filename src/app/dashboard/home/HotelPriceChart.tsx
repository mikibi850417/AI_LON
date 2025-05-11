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
import { Box, Typography, useTheme, Checkbox } from "@mui/material";

interface Props {
    data: any[];
    dates: string[];
}

// 차트에 사용할 다양한 색상 배열 - 네이버바 색상과 조화를 이루는 색상들
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

export default function HotelPriceChart({ data, dates }: Props) {
    const theme = useTheme();
    const [showAvgPrice, setShowAvgPrice] = useState(true);
    const [showMaxPrice, setShowMaxPrice] = useState(true);
    const [showMinPrice, setShowMinPrice] = useState(true);
    
    const groupedData = data.reduce((acc: any, curr: any) => {
        const { hotel_name, date, min_price } = curr;
        if (!acc[hotel_name]) acc[hotel_name] = {};
        acc[hotel_name][date] = min_price;
        return acc;
    }, {});

    const chartData = dates.map((date) => {
        const row: any = { date };
        Object.keys(groupedData).forEach((hotel) => {
            row[hotel] = parseFloat(groupedData[hotel]?.[date] || 0);
        });
        
        // 각 날짜별 평균, 최고, 최저 가격 계산
        const prices = Object.keys(groupedData)
            .map(hotel => parseFloat(groupedData[hotel]?.[date] || 0))
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
        const hotels = Object.keys(groupedData);
        const lines = [];
        
        // 호텔 라인 추가
        hotels.forEach((hotel, index) => {
            lines.push(
                <Line
                    key={`hotel-${index}`}
                    type="monotone"
                    dataKey={hotel}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
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
                    stroke="#e74c3c"
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
                            tickFormatter={(value) => value.replace(/^2025-/, '')}
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
                            formatter={(value: any) => [`₩${value.toLocaleString()}`, '']}
                        />
                        <Legend 
                            wrapperStyle={{ paddingTop: 15 }}
                            iconType="circle"
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
