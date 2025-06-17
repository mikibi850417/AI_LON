'use client';

import React, { useState } from 'react';
import {
    Container,
    Typography,
    CircularProgress,
    Box,
    Paper
} from '@mui/material';
import {
    PaymentPlans,
    PaymentDialog,
    SubscriptionStatus,
    usePayment,
    SubscriptionPlan
} from '@/lib/components/payment';

const PaymentPage: React.FC = () => {
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'white',
            padding: '24px',
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
            <Container maxWidth="lg" sx={{ 
                position: 'relative',
                zIndex: 1
            }}>
                {/* 헤더 섹션 */}
                <Paper elevation={10} sx={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backdropFilter: 'blur(10px)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    mb: 4,
                    transform: 'translateZ(0)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-5px) translateZ(0)',
                        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)'
                    }
                }}>
                    <Box sx={{
                        p: 4,
                        background: 'linear-gradient(90deg, #2c3e50, #4a6572)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
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
                        <Typography variant="h3" component="h1" sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            position: 'relative',
                            zIndex: 1,
                            mb: 2,
                            textAlign: 'center'
                        }}>
                            구독 플랜
                        </Typography>
                        <Typography variant="h6" sx={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            position: 'relative',
                            zIndex: 1,
                            textAlign: 'center'
                        }}>
                            AI를 활용한 호텔 가격 예측 서비스를 이용해보세요
                        </Typography>
                    </Box>
                </Paper>

                {/* 현재 구독 상태 */}
                <Box sx={{ mb: 4 }}>
                    <SubscriptionStatus subscriptionStatus={subscriptionStatus} />
                </Box>

                {/* 구독 플랜 목록 */}
                <Paper elevation={10} sx={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backdropFilter: 'blur(10px)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    transform: 'translateZ(0)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-5px) translateZ(0)',
                        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)'
                    }
                }}>
                    <Box sx={{ p: 4 }}>
                        <PaymentPlans plans={plans} onPlanSelect={handlePlanSelect} />
                    </Box>
                </Paper>

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
