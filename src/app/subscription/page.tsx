'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Typography,
    CircularProgress,
    Box,
    Paper,
    Chip,
    Grid
} from '@mui/material';
import {
    PaymentPlans,
    PaymentDialog,
    SubscriptionStatus,
    usePayment,
    SubscriptionPlan
} from '@/lib/components/payment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FavoriteIcon from '@mui/icons-material/Favorite';

const PaymentPage: React.FC = () => {
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const router = useRouter();

    const {
        plans,
        paymentStatus,
        subscriptionStatus,
        loading,
        processPayment,
        resetPaymentStatus
    } = usePayment();

    const handlePlanSelect = (plan: SubscriptionPlan) => {
        setSelectedPlan(plan);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        resetPaymentStatus();
        setSelectedPlan(null);
    };

    const handlePayment = async () => {
        if (selectedPlan) {
            await processPayment(selectedPlan);
        }
    };

    // 결제 완료 후 자동 리다이렉트
    useEffect(() => {
        if (paymentStatus.status === 'SUCCESS') {
            // 성공 메시지를 잠시 보여준 후 리다이렉트
            const timer = setTimeout(() => {
                router.push('/dashboard'); // 또는 원하는 다음 페이지 경로
            }, 2000); // 2초 후 리다이렉트

            return () => clearTimeout(timer);
        }
    }, [paymentStatus, router]);

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'white',
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: 'url("/pattern.png")',
                    opacity: 0.05,
                    zIndex: 0
                }
            }}>
                <CircularProgress size={60} sx={{
                    color: '#2c3e50',
                    position: 'relative',
                    zIndex: 1
                }} />
            </Box>
        );
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'white',
            position: 'relative',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: 'url("/pattern.png")',
                opacity: 0.05,
                zIndex: 0
            }
        }}>
            {/* 상단 프로모션 배너 삭제됨 */}

            <Container maxWidth="lg" sx={{
                position: 'relative',
                zIndex: 1,
                py: 6
            }}>
                {/* 메인 헤더 */}
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <Typography variant="h2" sx={{
                        color: '#2c3e50',
                        fontWeight: 'bold',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        mb: 4
                    }}>
                        AI 기반 호텔 매출 최적화 솔루션
                    </Typography>

                    {/* 신뢰도 지표 */}
                    <Grid container spacing={2} justifyContent="center" sx={{ mb: 4 }}>
                        <Grid item>
                            <Chip
                                icon={<PsychologyIcon sx={{ fontSize: '1.5rem !important' }} />}
                                label="AI 정밀 예측"
                                sx={{
                                    background: 'linear-gradient(45deg, #2c3e50, #4a6572)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    px: 2,
                                    py: 1,
                                    boxShadow: '0 2px 8px rgba(44, 62, 80, 0.3)',
                                    '& .MuiChip-icon': {
                                        color: '#ffd700',
                                        fontSize: '1.5rem'
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item>
                            <Chip
                                icon={<TrendingUpIcon sx={{ fontSize: '1.5rem !important' }} />}
                                label="수익의 극대화"
                                sx={{
                                    background: 'linear-gradient(45deg, #4a6572, #2c3e50)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    px: 2,
                                    py: 1,
                                    boxShadow: '0 2px 8px rgba(74, 101, 114, 0.3)',
                                    '& .MuiChip-icon': {
                                        color: '#4ade80',
                                        fontSize: '1.5rem'
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item>
                            <Chip
                                icon={<FavoriteIcon sx={{ fontSize: '1.5rem !important' }} />}
                                label="최고의 고객 만족도"
                                sx={{
                                    background: 'linear-gradient(45deg, #64748b, #475569)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    px: 2,
                                    py: 1,
                                    boxShadow: '0 2px 8px rgba(100, 116, 139, 0.3)',
                                    '& .MuiChip-icon': {
                                        color: '#ff6b9d',
                                        fontSize: '1.5rem'
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* 현재 구독 상태 */}
                <Box sx={{ mb: 6 }}>
                    <SubscriptionStatus subscriptionStatus={subscriptionStatus} />
                </Box>

                {/* 구독 플랜 목록 */}
                <Paper elevation={10} sx={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(44, 62, 80, 0.1)',
                    position: 'relative',
                    transform: 'translateZ(0)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-5px) translateZ(0)',
                        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)'
                    }
                }}>
                    {/* 플랜 헤더 */}
                    <Box sx={{
                        p: 4,
                        background: 'linear-gradient(90deg, #2c3e50, #4a6572)',
                        color: 'white',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'url("/pattern.png")',
                            opacity: 0.1,
                            zIndex: 0
                        }
                    }}>
                        <Typography variant="h4" sx={{
                            fontWeight: 'bold',
                            mb: 2,
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            완벽한 플랜을 선택하세요
                        </Typography>
                        <Typography variant="h6" sx={{
                            fontWeight: 'bold',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            🎉 1개월은 가볍게, 12개월은 똑똑하게. 기간이 길수록 할인 폭이 쭉쭉! 🎉
                        </Typography>
                    </Box>

                    <Box sx={{ p: 4 }}>
                        <PaymentPlans plans={plans} onPlanSelect={handlePlanSelect} />
                    </Box>
                </Paper>

                {/* 추가 혜택 섹션 */}
                <Grid container spacing={3} sx={{ mt: 6 }}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{
                            p: 3,
                            textAlign: 'center',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #2c3e50 0%, #4a6572 100%)',
                            color: 'white',
                            transform: 'translateY(0)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-10px)',
                                boxShadow: '0 20px 40px rgba(44, 62, 80, 0.3)'
                            }
                        }}>
                            <PsychologyIcon sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                                실시간 분석
                            </Typography>
                            <Typography variant="body2">
                                실시간 운영 데이터 분석으로 최적의 객실 요금을 놓치지 마세요.
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{
                            p: 3,
                            textAlign: 'center',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #4a6572 0%, #64748b 100%)',
                            color: 'white',
                            transform: 'translateY(0)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-10px)',
                                boxShadow: '0 20px 40px rgba(74, 101, 114, 0.3)'
                            }
                        }}>
                            <TrendingUpIcon sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                                수익 극대화
                            </Typography>
                            <Typography variant="body2">
                                AI가 분석한 경쟁 요금과 지역 수요 데이터를 기반으로 객실 수익을 극대화하세요.
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{
                            p: 3,
                            textAlign: 'center',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                            color: 'white',
                            transform: 'translateY(0)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-10px)',
                                boxShadow: '0 20px 40px rgba(100, 116, 139, 0.3)'
                            }
                        }}>
                            <FavoriteIcon sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                                안전한 매출 운영
                            </Typography>
                            <Typography variant="body2">
                                리스크 예측 및 가격 안정화 알고리즘으로 안정적이고 지속 가능한 수익 구조를 설계하세요.
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* 결제 다이얼로그 */}
                <PaymentDialog
                    open={dialogOpen}
                    selectedPlan={selectedPlan}
                    paymentStatus={paymentStatus}
                    onClose={handleCloseDialog}
                    onPayment={handlePayment}
                />
            </Container>
        </Box>
    );
};

export default PaymentPage;
