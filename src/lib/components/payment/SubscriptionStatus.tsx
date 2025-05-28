import React from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { SubscriptionStatus as SubscriptionStatusType } from './types';

interface SubscriptionStatusProps {
    subscriptionStatus: SubscriptionStatusType | null;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ subscriptionStatus }) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!subscriptionStatus) return null;

    return (
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
    );
};

export default SubscriptionStatus;
