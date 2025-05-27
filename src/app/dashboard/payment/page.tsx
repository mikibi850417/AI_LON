'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import PortOne from '@portone/browser-sdk/v2';
import { supabase } from '@/lib/supabaseClient';

// 구독 플랜 타입
interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    months: number;
    description: string;
}

// 결제 상태
interface PaymentStatus {
    status: 'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED';
    message?: string;
}

// 구독 상태
interface SubscriptionStatus {
    is_subscribed: boolean;
    subscription_end_date?: string;
    days_remaining?: number;
}

const PaymentPage: React.FC = () => {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'IDLE' });
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [userSession, setUserSession] = useState<any>(null);

    // API 기본 URL
    const API_BASE_URL = 'https://ailon.iptime.org:8000';

    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error getting session:', error);
                return;
            }

            if (session) {
                setUserSession(session);
                await loadInitialData(session);
            } else {
                console.error('No active session found');
                // Redirect to login or show error
            }
        } catch (error) {
            console.error('Error initializing auth:', error);
        }
    };

    const getAuthHeaders = () => {
        if (!userSession?.access_token) {
            throw new Error('No valid session found');
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userSession.access_token}`
        };
    };

    const loadInitialData = async (session?: any) => {
        try {
            setLoading(true);

            const currentSession = session || userSession;
            if (!currentSession?.access_token) {
                throw new Error('No valid session');
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentSession.access_token}`
            };

            // 구독 플랜 목록 로드
            const plansResponse = await fetch(`${API_BASE_URL}/api/billing/plans`, {
                headers
            });
            if (plansResponse.ok) {
                const plansData = await plansResponse.json();
                setPlans(plansData.plans);
            }

            // 현재 구독 상태 로드
            const statusResponse = await fetch(`${API_BASE_URL}/api/billing/subscription/status`, {
                headers
            });
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                setSubscriptionStatus(statusData);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelect = (plan: SubscriptionPlan) => {
        setSelectedPlan(plan);
        setDialogOpen(true);
    };

    const generateRandomId = () => {
        return [...crypto.getRandomValues(new Uint32Array(2))]
            .map((word) => word.toString(16).padStart(8, '0'))
            .join('');
    };

    const handlePayment = async () => {
        if (!selectedPlan || !userSession?.access_token) return;

        try {
            setPaymentStatus({ status: 'PENDING' });

            const authHeaders = getAuthHeaders();

            // 결제 요청 생성
            const createResponse = await fetch(`${API_BASE_URL}/api/billing/payment/create`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    plan: selectedPlan.id,
                    payment_method: 'CARD'
                }),
            });

            if (!createResponse.ok) {
                throw new Error('Failed to create payment');
            }

            const paymentData = await createResponse.json();

            // 포트원 결제 요청
            const payment = await PortOne.requestPayment({
                storeId: paymentData.store_id,
                channelKey: paymentData.channel_key,
                paymentId: paymentData.payment_id,
                orderName: paymentData.order_name,
                totalAmount: paymentData.amount,
                currency: paymentData.currency,
                payMethod: 'CARD',
                customer: {
                    email: paymentData.customer_email,
                    fullName: paymentData.customer_name,
                    phoneNumber: '010-0000-0000', // 이니시스 V2 필수 항목
                },
                customData: {
                    plan: selectedPlan.id,
                    user_id: userSession.user?.id || 'unknown'
                },
            });

            if (payment?.code !== undefined) {
                setPaymentStatus({
                    status: 'FAILED',
                    message: payment.message || 'Payment failed'
                });
                return;
            }

            if (!payment?.paymentId) {
                throw new Error('Payment ID not received');
            }

            // 결제 완료 처리
            const completeResponse = await fetch(`${API_BASE_URL}/api/billing/payment/complete`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    payment_id: payment.paymentId,
                }),
            });

            if (completeResponse.ok) {
                const paymentComplete = await completeResponse.json();
                setPaymentStatus({
                    status: paymentComplete.status === 'PAID' ? 'SUCCESS' : 'FAILED',
                    message: paymentComplete.message
                });

                if (paymentComplete.status === 'PAID') {
                    // 구독 상태 새로고침
                    await loadInitialData();
                }
            } else {
                const errorText = await completeResponse.text();
                setPaymentStatus({
                    status: 'FAILED',
                    message: errorText
                });
            }
        } catch (error) {
            console.error('Payment error:', error);
            setPaymentStatus({
                status: 'FAILED',
                message: error instanceof Error ? error.message : 'An error occurred'
            });
        }
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setPaymentStatus({ status: 'IDLE' });
        setSelectedPlan(null);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom align="center">
                구독 플랜
            </Typography>

            <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 4 }}>
                AI를 활용한 호텔 가격 예측 서비스를 이용해보세요
            </Typography>

            {/* 현재 구독 상태 */}
            {subscriptionStatus && (
                <Card sx={{ mb: 4, bgcolor: subscriptionStatus.is_subscribed ? 'success.light' : 'warning.light' }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            현재 구독 상태
                        </Typography>
                        {subscriptionStatus.is_subscribed ? (
                            <Box>
                                <Chip
                                    label="구독 중"
                                    color="success"
                                    icon={<CheckCircle />}
                                    sx={{ mb: 1 }}
                                />
                                {subscriptionStatus.subscription_end_date && (
                                    <Typography variant="body2">
                                        구독 만료일: {formatDate(subscriptionStatus.subscription_end_date)}
                                        {subscriptionStatus.days_remaining !== undefined && (
                                            <span> ({subscriptionStatus.days_remaining}일 남음)</span>
                                        )}
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            <Chip
                                label="구독 안함"
                                color="warning"
                                icon={<Cancel />}
                            />
                        )}
                    </CardContent>
                </Card>
            )}

            {/* 구독 플랜 목록 */}
            <Grid container spacing={3}>
                {plans.map((plan) => (
                    <Grid item xs={12} sm={6} md={3} key={plan.id}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: 4
                                }
                            }}
                            onClick={() => handlePlanSelect(plan)}
                        >
                            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                                <Typography variant="h5" component="h2" gutterBottom>
                                    {plan.name}
                                </Typography>

                                <Typography variant="h4" color="primary" gutterBottom>
                                    {formatCurrency(plan.price)}
                                </Typography>

                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {plan.description}
                                </Typography>

                                <Typography variant="body1" sx={{ mt: 2 }}>
                                    {plan.months}개월 이용
                                </Typography>

                                {plan.months > 1 && (
                                    <Chip
                                        label={`월 ${formatCurrency(Math.round(plan.price / plan.months))}`}
                                        size="small"
                                        color="secondary"
                                        sx={{ mt: 1 }}
                                    />
                                )}
                            </CardContent>

                            <Box sx={{ p: 2 }}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlanSelect(plan);
                                    }}
                                >
                                    선택하기
                                </Button>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* 결제 다이얼로그 */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedPlan?.name} 구독
                </DialogTitle>

                <DialogContent>
                    {selectedPlan && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {formatCurrency(selectedPlan.price)}
                            </Typography>

                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                {selectedPlan.description}
                            </Typography>

                            <Typography variant="body2" sx={{ mt: 2 }}>
                                • {selectedPlan.months}개월 이용 가능
                            </Typography>

                            <Typography variant="body2">
                                • AI 호텔 가격 예측 서비스
                            </Typography>

                            <Typography variant="body2">
                                • 실시간 가격 모니터링
                            </Typography>

                            <Typography variant="body2">
                                • 24/7 고객 지원
                            </Typography>
                        </Box>
                    )}

                    {/* 결제 상태 메시지 */}
                    {paymentStatus.status === 'PENDING' && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <CircularProgress size={20} />
                                결제를 처리하고 있습니다...
                            </Box>
                        </Alert>
                    )}

                    {paymentStatus.status === 'SUCCESS' && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            결제가 성공적으로 완료되었습니다!
                        </Alert>
                    )}

                    {paymentStatus.status === 'FAILED' && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {paymentStatus.message || '결제에 실패했습니다.'}
                        </Alert>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleCloseDialog}>
                        취소
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handlePayment}
                        disabled={paymentStatus.status === 'PENDING' || paymentStatus.status === 'SUCCESS'}
                    >
                        {paymentStatus.status === 'PENDING' ? '처리 중...' : '결제하기'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default PaymentPage;
