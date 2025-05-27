'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Button,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { Payment, Cancel, CheckCircle, Pending } from '@mui/icons-material';
import { supabase } from '@/lib/supabaseClient';

// 결제 이력 타입
interface PaymentHistory {
    id: string;
    payment_id: string;
    amount: number;
    currency: string;
    status: string;
    plan: string;
    created_at: string;
    completed_at?: string;
    order_name: string;
}

const PaymentHistoryPage: React.FC = () => {
    const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
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
                await loadPaymentHistory(session);
            } else {
                console.error('No active session found');
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

    const loadPaymentHistory = async (session?: any) => {
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

            const response = await fetch(`${API_BASE_URL}/api/billing/payment/history`, {
                headers
            });
            if (response.ok) {
                const data = await response.json();
                setPaymentHistory(data);
            } else {
                setAlert({ type: 'error', message: '결제 이력을 불러오는데 실패했습니다.' });
            }
        } catch (error) {
            console.error('Error loading payment history:', error);
            setAlert({ type: 'error', message: '결제 이력을 불러오는데 실패했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelPayment = async () => {
        if (!selectedPayment || !userSession?.access_token) return;

        try {
            setCancelling(true);

            const response = await fetch(`${API_BASE_URL}/api/billing/payment/cancel`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    payment_id: selectedPayment.payment_id,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setAlert({ type: 'success', message: '결제가 성공적으로 취소되었습니다.' });
                    await loadPaymentHistory(); // 목록 새로고침
                } else {
                    setAlert({ type: 'error', message: result.message || '결제 취소에 실패했습니다.' });
                }
            } else {
                setAlert({ type: 'error', message: '결제 취소에 실패했습니다.' });
            }
        } catch (error) {
            console.error('Error cancelling payment:', error);
            setAlert({ type: 'error', message: '결제 취소에 실패했습니다.' });
        } finally {
            setCancelling(false);
            setCancelDialogOpen(false);
            setSelectedPayment(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusChip = (status: string) => {
        switch (status) {
            case 'PAID':
                return <Chip label="결제 완료" color="success" icon={<CheckCircle />} size="small" />;
            case 'PENDING':
                return <Chip label="결제 대기" color="warning" icon={<Pending />} size="small" />;
            case 'CANCELLED':
                return <Chip label="결제 취소" color="error" icon={<Cancel />} size="small" />;
            case 'FAILED':
                return <Chip label="결제 실패" color="error" icon={<Cancel />} size="small" />;
            default:
                return <Chip label={status} color="default" size="small" />;
        }
    };

    const getPlanName = (plan: string) => {
        const planMap: { [key: string]: string } = {
            '1month': '1개월 구독',
            '3months': '3개월 구독',
            '6months': '6개월 구독',
            '12months': '12개월 구독'
        };
        return planMap[plan] || plan;
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
            <Box display="flex" alignItems="center" gap={2} mb={4}>
                <Payment color="primary" />
                <Typography variant="h4" component="h1">
                    결제 내역
                </Typography>
            </Box>

            {alert && (
                <Alert
                    severity={alert.type}
                    onClose={() => setAlert(null)}
                    sx={{ mb: 3 }}
                >
                    {alert.message}
                </Alert>
            )}

            {paymentHistory.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 8 }}>
                        <Payment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            결제 내역이 없습니다
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            구독을 시작하여 서비스를 이용해보세요.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>결제 ID</TableCell>
                                    <TableCell>상품명</TableCell>
                                    <TableCell>플랜</TableCell>
                                    <TableCell align="right">금액</TableCell>
                                    <TableCell>상태</TableCell>
                                    <TableCell>결제일시</TableCell>
                                    <TableCell align="center">액션</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paymentHistory.map((payment) => (
                                    <TableRow key={payment.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontFamily="monospace">
                                                {payment.payment_id.substring(0, 16)}...
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{payment.order_name}</TableCell>
                                        <TableCell>{getPlanName(payment.plan)}</TableCell>
                                        <TableCell align="right">
                                            <Typography variant="subtitle2">
                                                {formatCurrency(payment.amount)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{getStatusChip(payment.status)}</TableCell>
                                        <TableCell>{formatDateTime(payment.created_at)}</TableCell>
                                        <TableCell align="center">
                                            {payment.status === 'PENDING' && (
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedPayment(payment);
                                                        setCancelDialogOpen(true);
                                                    }}
                                                >
                                                    취소
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            )}

            {/* 결제 취소 확인 다이얼로그 */}
            <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
                <DialogTitle>결제 취소 확인</DialogTitle>
                <DialogContent>
                    <Typography>
                        정말로 이 결제를 취소하시겠습니까?
                    </Typography>
                    {selectedPayment && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2">상품명: {selectedPayment.order_name}</Typography>
                            <Typography variant="body2">금액: {formatCurrency(selectedPayment.amount)}</Typography>
                            <Typography variant="body2">결제일시: {formatDateTime(selectedPayment.created_at)}</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setCancelDialogOpen(false)}
                        disabled={cancelling}
                    >
                        아니오
                    </Button>
                    <Button
                        onClick={handleCancelPayment}
                        color="error"
                        variant="contained"
                        disabled={cancelling}
                    >
                        {cancelling ? <CircularProgress size={20} /> : '네, 취소합니다'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default PaymentHistoryPage;
