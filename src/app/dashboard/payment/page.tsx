'use client';

import React, { useState } from 'react';
import {
    Container,
    Typography,
    CircularProgress
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
            <SubscriptionStatus subscriptionStatus={subscriptionStatus} />

            {/* 구독 플랜 목록 */}
            <PaymentPlans plans={plans} onPlanSelect={handlePlanSelect} />

            {/* 결제 다이얼로그 */}
            <PaymentDialog
                open={dialogOpen}
                selectedPlan={selectedPlan}
                paymentStatus={paymentStatus}
                onClose={handleCloseDialog}
                onPayment={handlePayment}
            />
        </Container>
    );
};

export default PaymentPage;
