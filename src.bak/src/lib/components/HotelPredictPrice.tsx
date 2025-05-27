"use client";

import React, { useState } from "react";
import { Box, Typography, TextField, Button, MenuItem, CircularProgress, Card, CardContent, Divider, Alert, Fade, Grow, Zoom } from "@mui/material";
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
    title = "호텔 가격 추천",
    apiEndpoint = "http://ailon.iptime.org:8000/api/price/predict",
    extraInfo
}: HotelPredictPriceProps) {
    const [selectedDate, setSelectedDate] = useState<string>(dates[0] || "");
    const [occupancy, setOccupancy] = useState<number>(50);
    const [risk, setRisk] = useState<number>(1);
    const [predictionResults, setPredictionResults] = useState<{[key: number]: string | null}>({
        1: null,
        2: null,
        3: null
    });
    const [predicting, setPredicting] = useState<boolean>(false);

    // 디버깅 관련 상태는 유지하되 표시하지 않음
    const [debugPayload, setDebugPayload] = useState<any>(null);
    const [showDebug, setShowDebug] = useState<boolean>(false); // 기본값을 false로 설정

    // 애니메이션을 위한 상태 추가
    const [showResults, setShowResults] = useState<boolean>(false);
    const [animationStep, setAnimationStep] = useState<number>(0);

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

        setPredicting(true);
        setPredictionResults({1: null, 2: null, 3: null});
        setShowResults(false);
        setAnimationStep(0);
        
        try {
            // 세 가지 리스크 레벨에 대해 병렬로 API 호출
            const results = await Promise.all([1, 2, 3].map(async (riskLevel) => {
                const payload = {
                    date: selectedDate,
                    region: userRegion.region,
                    address: userRegion.location_code,
                    occupancy,
                    risk: riskLevel,
                    prices: prices.slice(0, 5), // 상위 5개 최저가만 사용
                };

                // 디버깅 정보 저장은 유지하되 표시하지 않음
                if (riskLevel === 1) {
                    setDebugPayload(payload);
                    // setShowDebug(true); // 이 줄을 주석 처리하거나 제거
                }

                console.log(`리스크 ${riskLevel} API 요청 페이로드:`, payload);

                const response = await fetch(apiEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error(`API 응답 오류: ${response.status}`);
                }

                const result = await response.json();
                console.log(`리스크 ${riskLevel} API 응답 결과:`, result);
                return { risk: riskLevel, result };
            }));

            // 결과 업데이트
            const newResults = {...predictionResults};
            results.forEach(({risk, result}) => {
                newResults[risk] = `₩${parseInt(result.predicted_price).toLocaleString()}`;
            });
            setPredictionResults(newResults);
            
            // 애니메이션 시작
            setShowResults(true);
            
            // 단계적 애니메이션을 위한 타이머 설정
            setTimeout(() => setAnimationStep(1), 300);
            setTimeout(() => setAnimationStep(2), 600);
            setTimeout(() => setAnimationStep(3), 900);
        } catch (error: any) {
            console.error("예측 API 호출 실패:", error.message || error);
            setPredictionResults({
                1: "예측 실패. 네트워크 상태를 확인하거나 다시 시도해주세요.",
                2: "예측 실패. 네트워크 상태를 확인하거나 다시 시도해주세요.",
                3: "예측 실패. 네트워크 상태를 확인하거나 다시 시도해주세요."
            });
            setShowResults(true);
            setAnimationStep(3); // 에러 시 모든 결과 한번에 표시
        } finally {
            setPredicting(false);
        }
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#1a365d',
                borderBottom: '2px solid #e2e8f0',
                pb: 2,
                fontWeight: 800,
                letterSpacing: '0.8px',
                textShadow: '0px 1px 2px rgba(0,0,0,0.05)'
            }}>
                <CalculateIcon sx={{ mr: 1.5, color: '#3182ce', filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.1))' }} />
                {title}
            </Typography>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: extraInfo ? '1fr 1fr' : '1fr' },
                gap: 4,
                mt: 3
            }}>
                {/* 가격 예측 입력 폼 */}
                <Card sx={{
                    borderRadius: 4,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 10px 20px rgba(49, 130, 206, 0.1)',
                    background: 'linear-gradient(165deg, #ffffff, #f8fafc)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': {
                        boxShadow: '0 25px 50px rgba(0,0,0,0.12), 0 15px 25px rgba(49, 130, 206, 0.15)',
                        transform: 'translateY(-8px) scale(1.01)'
                    }
                }}>
                    <CardContent sx={{ 
                        p: 4,
                        background: 'radial-gradient(circle at top right, rgba(49, 130, 206, 0.05), transparent 70%)'
                    }}>
                        {/* 사용자 지역 정보 - 텍스트 삭제하고 기능만 유지 */}
                        {userRegion ? (
                            <Box sx={{ mb: 2 }}>
                                {/* 지역 정보 텍스트 삭제 */}
                            </Box>
                        ) : (
                            <Alert severity="error" sx={{ 
                                mb: 3, 
                                borderRadius: 2,
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                    '0%': { boxShadow: '0 0 0 0 rgba(229, 62, 62, 0.4)' },
                                    '70%': { boxShadow: '0 0 0 10px rgba(229, 62, 62, 0)' },
                                    '100%': { boxShadow: '0 0 0 0 rgba(229, 62, 62, 0)' }
                                },
                                '& .MuiAlert-icon': {
                                    color: '#e53e3e'
                                }
                            }}>
                                지역 정보를 불러오지 못했습니다. 지역 정보가 필요합니다.
                            </Alert>
                        )}

                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 3,
                            mb: 4
                        }}>
                            {/* 날짜 선택 */}
                            <TextField
                                select
                                label="날짜 선택"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                fullWidth
                                variant="outlined"
                                sx={{ 
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2.5,
                                        backgroundColor: 'white',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#3182ce',
                                            borderWidth: '1.5px'
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#3182ce',
                                            borderWidth: 2
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#4a5568',
                                        fontWeight: 500,
                                        '&.Mui-focused': {
                                            color: '#3182ce',
                                            fontWeight: 600
                                        }
                                    },
                                    '& .MuiSelect-select': {
                                        padding: '16px 18px'
                                    }
                                }}
                            >
                                {dates.map((date) => (
                                    <MenuItem key={date} value={date}>
                                        {date}
                                    </MenuItem>
                                ))}
                            </TextField>

                            {/* Occupancy 입력 */}
                            <TextField
                                type="text"
                                label="점유율 (0-100)"
                                value={occupancy}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || /^\d+$/.test(value)) {
                                        const numValue = value === '' ? 0 : parseInt(value, 10);
                                        if (numValue <= 100) {
                                            setOccupancy(numValue);
                                        }
                                    }
                                }}
                                fullWidth
                                variant="outlined"
                                sx={{ 
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2.5,
                                        backgroundColor: 'white',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#3182ce',
                                            borderWidth: '1.5px'
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#3182ce',
                                            borderWidth: 2
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#4a5568',
                                        fontWeight: 500,
                                        '&.Mui-focused': {
                                            color: '#3182ce',
                                            fontWeight: 600
                                        }
                                    },
                                    '& .MuiInputBase-input': {
                                        padding: '16px 18px'
                                    }
                                }}
                            />
                        </Box>

                        {/* 예측 버튼 */}
                        <Zoom in={!showResults || !predictionResults[1]} timeout={600}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handlePredict}
                                disabled={predicting || !userRegion || !selectedDate}
                                fullWidth
                                startIcon={predicting ? 
                                    <CircularProgress size={22} color="inherit" /> : 
                                    <CalculateIcon sx={{ animation: 'bounce 1s infinite alternate', '@keyframes bounce': {
                                        '0%': { transform: 'translateY(0)' },
                                        '100%': { transform: 'translateY(-4px)' }
                                    } }} />
                                }
                                sx={{
                                    background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
                                    color: 'white',
                                    py: 2,
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '1.05rem',
                                    letterSpacing: '0.5px',
                                    boxShadow: '0 8px 20px rgba(49, 130, 206, 0.4), 0 4px 12px rgba(49, 130, 206, 0.2)',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: '-100%',
                                        width: '100%',
                                        height: '100%',
                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                        transition: 'all 0.6s ease',
                                    },
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #3182ce 0%, #2c5282 100%)',
                                        boxShadow: '0 12px 28px rgba(49, 130, 206, 0.5), 0 8px 16px rgba(49, 130, 206, 0.3)',
                                        transform: 'translateY(-3px) scale(1.02)',
                                        '&::before': {
                                            left: '100%'
                                        }
                                    },
                                    '&:active': {
                                        transform: 'translateY(1px) scale(0.98)',
                                        boxShadow: '0 5px 15px rgba(49, 130, 206, 0.3)'
                                    },
                                    '&:disabled': {
                                        background: 'linear-gradient(135deg, #a0aec0 0%, #718096 100%)',
                                        color: 'white'
                                    },
                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}
                            >
                                {predicting ? '추천 중...' : 'AI 추천 가격 확인'}
                            </Button>
                        </Zoom>

                        {/* 예측 결과 출력 - 극적인 애니메이션 효과 적용 */}
                        <Fade in={showResults} timeout={1000}>
                            <Box sx={{ 
                                mt: 4, 
                                borderRadius: 4,
                                overflow: 'hidden',
                                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.15), 0 5px 15px rgba(0, 0, 0, 0.08)',
                                opacity: showResults ? 1 : 0,
                                transform: showResults ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
                                transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}>
                                <Zoom in={showResults} timeout={700} style={{ transformOrigin: 'center top' }}>
                                    <Box sx={{ 
                                        background: 'linear-gradient(135deg, #2c5282 0%, #1a365d 100%)',
                                        p: 3,
                                        textAlign: 'center',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: '-50%',
                                            left: '-50%',
                                            width: '200%',
                                            height: '200%',
                                            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                                            transform: 'rotate(30deg)'
                                        }
                                    }}>
                                        <Typography variant="h6" sx={{ 
                                            fontWeight: 800, 
                                            color: 'white',
                                            letterSpacing: '1px',
                                            textShadow: '0px 2px 4px rgba(0,0,0,0.2)',
                                            animation: 'glow 2s infinite alternate',
                                            '@keyframes glow': {
                                                '0%': { textShadow: '0 0 5px rgba(255,255,255,0.5), 0 0 10px rgba(255,255,255,0.3)' },
                                                '100%': { textShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.5)' }
                                            }
                                        }}>
                                            AI 추천 가격
                                        </Typography>
                                    </Box>
                                </Zoom>
                                
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    bgcolor: 'white',
                                    background: 'linear-gradient(to bottom, #f8fafc, #ffffff)'
                                }}>
                                    {[1, 2, 3].map(riskLevel => (
                                        <Grow 
                                            key={riskLevel}
                                            in={animationStep >= riskLevel}
                                            timeout={700}
                                            style={{ 
                                                transformOrigin: 'center left',
                                                transitionDelay: `${(riskLevel - 1) * 200}ms`
                                            }}
                                        >
                                            <Box 
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    p: 3.5,
                                                    borderBottom: riskLevel < 3 ? '1px solid rgba(226, 232, 240, 0.8)' : 'none',
                                                    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                    backgroundColor: animationStep === riskLevel ? 
                                                        (riskLevel === 1 ? 'rgba(72, 187, 120, 0.15)' : 
                                                         riskLevel === 2 ? 'rgba(237, 137, 54, 0.15)' : 
                                                         'rgba(229, 62, 62, 0.15)') : 'transparent',
                                                    transform: animationStep === riskLevel ? 'scale(1.03)' : 'scale(1)',
                                                    boxShadow: animationStep === riskLevel ? 
                                                        (riskLevel === 1 ? '0 5px 15px rgba(72, 187, 120, 0.2)' : 
                                                         riskLevel === 2 ? '0 5px 15px rgba(237, 137, 54, 0.2)' : 
                                                         '0 5px 15px rgba(229, 62, 62, 0.2)') : 'none',
                                                    '&:hover': {
                                                        backgroundColor: riskLevel === 1 ? 'rgba(72, 187, 120, 0.1)' : 
                                                                      riskLevel === 2 ? 'rgba(237, 137, 54, 0.1)' : 
                                                                      'rgba(229, 62, 62, 0.1)',
                                                        transform: 'translateX(10px) scale(1.02)',
                                                        boxShadow: riskLevel === 1 ? '0 5px 15px rgba(72, 187, 120, 0.15)' : 
                                                                  riskLevel === 2 ? '0 5px 15px rgba(237, 137, 54, 0.15)' : 
                                                                  '0 5px 15px rgba(229, 62, 62, 0.15)'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box sx={{ 
                                                        width: 14, 
                                                        height: 14, 
                                                        borderRadius: '50%',
                                                        backgroundColor: riskLevel === 1 ? '#48bb78' : 
                                                                        riskLevel === 2 ? '#ed8936' : 
                                                                        '#e53e3e',
                                                        mr: 2.5,
                                                        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                        transform: animationStep === riskLevel ? 'scale(1.8)' : 'scale(1)',
                                                        boxShadow: animationStep === riskLevel ? 
                                                            (riskLevel === 1 ? '0 0 0 4px rgba(72, 187, 120, 0.3), 0 0 0 8px rgba(72, 187, 120, 0.1)' : 
                                                             riskLevel === 2 ? '0 0 0 4px rgba(237, 137, 54, 0.3), 0 0 0 8px rgba(237, 137, 54, 0.1)' : 
                                                             '0 0 0 4px rgba(229, 62, 62, 0.3), 0 0 0 8px rgba(229, 62, 62, 0.1)') : 'none',
                                                        animation: animationStep === riskLevel ? 'pulse-dot 1.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite' : 'none',
                                                        '@keyframes pulse-dot': {
                                                            '0%': { boxShadow: '0 0 0 0 rgba(72, 187, 120, 0.4)' },
                                                            '70%': { boxShadow: '0 0 0 10px rgba(72, 187, 120, 0)' },
                                                            '100%': { boxShadow: '0 0 0 0 rgba(72, 187, 120, 0)' }
                                                        }
                                                    }} />
                                                    <Typography variant="subtitle1" sx={{ 
                                                        fontWeight: 700,
                                                        color: '#2d3748',
                                                        letterSpacing: '0.3px'
                                                    }}>
                                                        리스크 {riskLevel}
                                                        <Typography 
                                                            component="span" 
                                                            variant="caption" 
                                                            sx={{ 
                                                                ml: 1.5, 
                                                                color: '#718096',
                                                                fontWeight: 500,
                                                                backgroundColor: riskLevel === 1 ? 'rgba(72, 187, 120, 0.1)' : 
                                                                               riskLevel === 2 ? 'rgba(237, 137, 54, 0.1)' : 
                                                                               'rgba(229, 62, 62, 0.1)',
                                                                px: 1.2,
                                                                py: 0.5,
                                                                borderRadius: 5
                                                            }}
                                                        >
                                                            {riskLevel === 1 ? '(보수적)' : 
                                                             riskLevel === 2 ? '(중립적)' : 
                                                             '(공격적)'}
                                                        </Typography>
                                                    </Typography>
                                                </Box>
                                                <Typography 
                                                    variant="h5" 
                                                    sx={{ 
                                                        fontWeight: 800,
                                                        color: riskLevel === 1 ? '#2f855a' : 
                                                               riskLevel === 2 ? '#c05621' : 
                                                               '#c53030',
                                                        opacity: animationStep >= riskLevel ? 1 : 0,
                                                        transform: animationStep >= riskLevel ? 'translateX(0) scale(1)' : 'translateX(30px) scale(0.9)',
                                                        transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                        textShadow: animationStep === riskLevel ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                                                        animation: animationStep === riskLevel ? 'highlight 1s ease-in-out' : 'none',
                                                        '@keyframes highlight': {
                                                            '0%': { transform: 'scale(1)' },
                                                            '50%': { transform: 'scale(1.15)' },
                                                            '100%': { transform: 'scale(1)' }
                                                        }
                                                    }}
                                                >
                                                    {predictionResults[riskLevel] || '계산 중...'}
                                                </Typography>
                                            </Box>
                                        </Grow>
                                    ))}
                                </Box>
                            </Box>
                        </Fade>
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
