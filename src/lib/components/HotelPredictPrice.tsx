"use client";

import React, { useState } from "react";
import { Box, Typography, TextField, Button, MenuItem, CircularProgress, Card, CardContent, Divider, Alert } from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import BugReportIcon from "@mui/icons-material/BugReport";

// 표준화된 인터페이스 정의
export interface PriceDataItem {
    date: string;
    price: number;
}

export interface UserRegion {
    location_code: string;
    region: string;
}

export interface HotelPredictPriceProps {
    // 필수 속성
    dates: string[];


    userRegion: UserRegion | null;
    getPricesForDate: (date: string) => number[];

    // 선택적 속성
    title?: string;
    apiEndpoint?: string;
    extraInfo?: React.ReactNode;
}

export default function HotelPredictPrice({
    dates,
    userRegion,
    getPricesForDate,
    title = "호텔 가격 예측",
    apiEndpoint = "http://ailon.iptime.org:8000/api/price/predict",
    extraInfo
}: HotelPredictPriceProps) {
    const [selectedDate, setSelectedDate] = useState<string>(dates[0] || "");
    const [occupancy, setOccupancy] = useState<number>(50);
    const [risk, setRisk] = useState<number>(1);
    const [predictionResult, setPredictionResult] = useState<string | null>(null);
    const [predicting, setPredicting] = useState<boolean>(false);

    // 디버깅을 위한 상태 추가
    const [debugPayload, setDebugPayload] = useState<any>(null);
    const [showDebug, setShowDebug] = useState<boolean>(false);

    const handlePredict = async () => {
        if (!selectedDate || !userRegion) {
            alert("날짜와 지역 정보를 확인해주세요.");
            return;
        }

        // 선택된 날짜에 대한 가격 데이터 가져오기
        const prices = getPricesForDate(selectedDate);

        if (prices.length === 0) {
            alert("선택한 날짜에 대한 가격 데이터가 없습니다.");
            return;
        }

        const payload = {
            date: selectedDate,
            region: userRegion.region,
            address: userRegion.location_code,
            occupancy,
            risk,
            prices: prices.slice(0, 5), // 상위 5개 최저가만 사용
        };

        // 디버깅을 위해 페이로드 저장
        setDebugPayload(payload);
        setShowDebug(true);

        setPredicting(true);
        setPredictionResult(null);

        try {
            console.log("API 요청 페이로드:", payload);

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`API 응답 오류: ${response.status}`);
            }

            const result = await response.json();
            console.log("API 응답 결과:", result);
            setPredictionResult(`예측된 가격: ₩${parseInt(result.predicted_price).toLocaleString()}`);
        } catch (error: any) {
            console.error("예측 API 호출 실패:", error.message || error);
            setPredictionResult("예측 실패. 네트워크 상태를 확인하거나 다시 시도해주세요.");
        } finally {
            setPredicting(false);
        }
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#2c3e50',
                borderBottom: '2px solid #e2e8f0',
                pb: 1
            }}>
                <CalculateIcon sx={{ mr: 1 }} />
                {title}
            </Typography>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: extraInfo ? '1fr 1fr' : '1fr' },
                gap: 3
            }}>
                {/* 가격 예측 입력 폼 */}
                <Card sx={{
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            가격 예측하기
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        {/* 사용자 지역 정보 */}
                        {userRegion ? (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                                    지역: {userRegion.region} (코드: {userRegion.location_code})
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="error">
                                    지역 정보를 불러오지 못했습니다. 지역 정보가 필요합니다.
                                </Typography>
                            </Box>
                        )}

                        {/* 날짜 선택 */}
                        <TextField
                            select
                            label="날짜 선택"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            {dates.map((date) => (
                                <MenuItem key={date} value={date}>
                                    {date}
                                </MenuItem>
                            ))}
                        </TextField>

                        {/* Occupancy 입력 */}
                        <TextField
                            type="number"
                            label="Occupancy (1-100)"
                            value={occupancy}
                            onChange={(e) => setOccupancy(Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                            fullWidth
                            sx={{ mb: 2 }}
                        />

                        {/* Risk 입력 */}
                        <TextField
                            select
                            label="Risk (1-3)"
                            value={risk}
                            onChange={(e) => setRisk(parseInt(e.target.value, 10))}
                            fullWidth
                            sx={{ mb: 3 }}
                        >
                            {[1, 2, 3].map((value) => (
                                <MenuItem key={value} value={value}>
                                    {value}
                                </MenuItem>
                            ))}
                        </TextField>

                        {/* 디버깅 정보 표시 */}
                        {showDebug && debugPayload && (
                            <Box sx={{ mt: 3, mb: 2 }}>
                                <Alert
                                    severity="info"
                                    icon={<BugReportIcon />}
                                    sx={{ mb: 2 }}
                                >
                                    <Typography variant="subtitle2">디버깅 정보 (API 요청 내용)</Typography>
                                </Alert>
                                <Box
                                    sx={{
                                        backgroundColor: '#f5f5f5',
                                        p: 2,
                                        borderRadius: 1,
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                        overflowX: 'auto'
                                    }}
                                >
                                    <pre style={{ margin: 0 }}>
                                        {JSON.stringify(debugPayload, null, 2)}
                                    </pre>
                                </Box>
                            </Box>
                        )}

                        {/* 예측 버튼 */}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handlePredict}
                            disabled={predicting || !userRegion || !selectedDate}
                            fullWidth
                            startIcon={predicting ? <CircularProgress size={20} color="inherit" /> : null}
                            sx={{
                                backgroundColor: '#2c3e50',
                                '&:hover': {
                                    backgroundColor: '#34495e',
                                },
                            }}
                        >
                            {predicting ? '예측 중...' : '예측 가격 확인'}
                        </Button>

                        {/* 예측 결과 출력 */}
                        {predictionResult && (
                            <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, textAlign: 'center' }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                                    {predictionResult}
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* 추가 정보 영역 (만약 제공되었다면) */}
                {extraInfo && (
                    <Box>
                        {extraInfo}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
