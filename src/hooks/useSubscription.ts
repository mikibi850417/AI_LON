import { useEffect, useState } from 'react';
import { useSession } from './useSession';

interface SubscriptionStatus {
    isSubscribed: boolean;
    subscriptionEndDate: string | null;
    loading: boolean;
    error: string | null;
}

export function useSubscription() {
    const { session } = useSession();
    const [status, setStatus] = useState<SubscriptionStatus>({
        isSubscribed: false,
        subscriptionEndDate: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        async function checkSubscription() {
            if (!session?.user?.id) {
                setStatus(prev => ({
                    ...prev,
                    loading: false
                }));
                return;
            }

            try {
                const response = await fetch(`/api/billing/subscription-status/${session.user.id}`);
                if (!response.ok) {
                    throw new Error('구독 상태 확인에 실패했습니다.');
                }
                const { data } = await response.json();

                if (!data) {
                    throw new Error('구독 정보를 불러올 수 없습니다.');
                }

                setStatus({
                    isSubscribed: data.is_subscribed,
                    subscriptionEndDate: data.subscription_end_date,
                    loading: false,
                    error: null,
                });
            } catch (error) {
                setStatus(prev => ({
                    ...prev,
                    loading: false,
                    error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
                }));
            }
        }

        checkSubscription();
    }, [session?.user?.id]);

    return status;
}

export async function initiateSubscription(userId: string, months: number) {
    const response = await fetch('/api/billing/create-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            months,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '결제 세션 생성에 실패했습니다.');
    }

    const data = await response.json();
    return {
        paymentUrl: data.data.payment_url,
        paymentId: data.data.payment_id
    };
}

export async function verifyPayment(paymentId: string, userId: string) {
    const response = await fetch(`/api/billing/verify-payment/${paymentId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '결제 확인에 실패했습니다.');
    }

    const result = await response.json();
    return {
        status: result.status,
        message: result.message,
        data: result.data
    };
}
