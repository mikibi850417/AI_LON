import { useState, useEffect, useCallback } from 'react';
import PortOne from '@portone/browser-sdk/v2';
import { supabase } from '@/lib/supabaseClient';
import { SubscriptionPlan, PaymentStatus, SubscriptionStatus } from './types';
import { Session } from '@supabase/supabase-js';

export const usePayment = () => {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'IDLE' });
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [userSession, setUserSession] = useState<Session | null>(null);
    const [initialized, setInitialized] = useState(false);

    // API 기본 URL
    const API_BASE_URL = 'https://ailon.iptime.org:8000';

    // loadInitialData 함수 - userSession을 매개변수로 받도록 수정
    const loadInitialData = useCallback(async (session?: Session | null) => {
        try {
            setLoading(true);

            const currentSession = session;
            if (!currentSession?.access_token) {
                console.warn('No valid session found, using demo data');
                // 세션이 없을 때 데모 데이터 제공
                setPlans([
                    {
                        id: 'basic',
                        name: 'Basic Plan',
                        price: 29000,
                        months: 1,
                        description: '기본 플랜 - 기본 기능, 월 100회 조회'
                    },
                    {
                        id: 'premium',
                        name: 'Premium Plan', 
                        price: 49000,
                        months: 1,
                        description: '프리미엄 플랜 - 모든 기능, 무제한 조회, 우선 지원'
                    }
                ]);
                setSubscriptionStatus(null);
                setLoading(false);
                return;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentSession.access_token}`
            };

            try {
                // 구독 플랜 목록 로드
                const plansResponse = await fetch(`${API_BASE_URL}/api/billing/plans`, {
                    headers
                });
                
                if (plansResponse.ok) {
                    const plansData = await plansResponse.json();
                    setPlans(plansData.plans || []);
                } else {
                    console.warn('Failed to fetch plans, using fallback data');
                    // API 호출 실패 시 fallback 데이터 제공
                    setPlans([
                        {
                            id: 'basic',
                            name: 'Basic Plan',
                            price: 29000,
                            months: 1,
                            description: '기본 플랜 - 기본 기능, 월 100회 조회'
                        },
                        {
                            id: 'premium',
                            name: 'Premium Plan',
                            price: 49000,
                            months: 1,
                            description: '프리미엄 플랜 - 모든 기능, 무제한 조회, 우선 지원'
                        }
                    ]);
                }
            } catch (plansError) {
                console.warn('Network error fetching plans:', plansError);
                // 네트워크 에러 시 fallback 데이터 제공
                setPlans([
                    {
                        id: 'basic',
                        name: 'Basic Plan',
                        price: 29000,
                        months: 1,
                        description: '기본 플랜 - 기본 기능, 월 100회 조회'
                    },
                    {
                        id: 'premium',
                        name: 'Premium Plan',
                        price: 49000,
                        months: 1,
                        description: '프리미엄 플랜 - 모든 기능, 무제한 조회, 우선 지원'
                    }
                ]);
            }

            try {
                // 현재 구독 상태 로드
                const statusResponse = await fetch(`${API_BASE_URL}/api/billing/subscription/status`, {
                    headers
                });
                
                if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    setSubscriptionStatus(statusData);
                } else {
                    console.warn('Failed to fetch subscription status');
                    setSubscriptionStatus(null);
                }
            } catch (statusError) {
                console.warn('Network error fetching subscription status:', statusError);
                setSubscriptionStatus(null);
            }

        } catch (error) {
            console.error('Error loading initial data:', error);
            // 전체적인 에러 발생 시에도 기본 데이터 제공
            setPlans([
                {
                    id: 'basic',
                    name: 'Basic Plan',
                    price: 29000,
                    months: 1,
                    description: '기본 플랜 - 기본 기능, 월 100회 조회'
                },
                {
                    id: 'premium',
                    name: 'Premium Plan',
                    price: 49000,
                    months: 1,
                    description: '프리미엄 플랜 - 모든 기능, 무제한 조회, 우선 지원'
                }
            ]);
            setSubscriptionStatus(null);
        } finally {
            setLoading(false);
        }
    }, []); // 의존성 배열 비우기

    // 초기화는 한 번만 실행되도록 수정
    useEffect(() => {
        if (initialized) return;

        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('Error getting session:', error);
                    // 세션 에러가 있어도 기본 데이터는 로드
                    await loadInitialData(null);
                    return;
                }

                if (session) {
                    setUserSession(session);
                    await loadInitialData(session);
                } else {
                    console.warn('No active session found, loading with demo data');
                    // 세션이 없어도 기본 데이터 로드
                    await loadInitialData(null);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                // 인증 초기화 실패 시에도 기본 데이터 로드
                await loadInitialData(null);
            } finally {
                setInitialized(true);
            }
        };

        initializeAuth();
    }, [initialized, loadInitialData]); // initialized와 loadInitialData에만 의존

    const getAuthHeaders = () => {
        if (!userSession?.access_token) {
            throw new Error('No valid session found');
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userSession.access_token}`
        };
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
                    await loadInitialData(userSession);
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

    // 새로고침용 함수 - 현재 세션 사용
    const refreshData = useCallback(async () => {
        await loadInitialData(userSession);
    }, [loadInitialData, userSession]);

    return {
        plans,
        paymentStatus,
        subscriptionStatus,
        loading,
        processPayment,
        resetPaymentStatus,
        refreshData
    };
};
