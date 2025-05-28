import React from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Typography,
    Chip
} from '@mui/material';
import { SubscriptionPlan } from './types';

interface PaymentPlansProps {
    plans: SubscriptionPlan[];
    onPlanSelect: (plan: SubscriptionPlan) => void;
}

const PaymentPlans: React.FC<PaymentPlansProps> = ({ plans, onPlanSelect }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };

    return (
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
                        onClick={() => onPlanSelect(plan)}
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
                                    onPlanSelect(plan);
                                }}
                            >
                                선택하기
                            </Button>
                        </Box>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default PaymentPlans;
