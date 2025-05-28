import { useState, useEffect } from 'react';
import PortOne from '@portone/browser-sdk/v2';
import { supabase } from '@/lib/supabaseClient';
import { SubscriptionPlan, PaymentStatus, SubscriptionStatus } from './types';

export const usePayment = () => {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'IDLE' });
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
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

    const processPayment = async (selectedPlan: SubscriptionPlan): Promise<void> => {
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
                    phoneNumber: '010-0000-0000',
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

    const resetPaymentStatus = () => {
        setPaymentStatus({ status: 'IDLE' });
    };

    return {
        plans,
        paymentStatus,
        subscriptionStatus,
        loading,
        processPayment,
        resetPaymentStatus,
        refreshData: loadInitialData
    };
};
