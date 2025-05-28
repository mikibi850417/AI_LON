// 구독 플랜 타입
export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    months: number;
    description: string;
}

// 결제 상태
export interface PaymentStatus {
    status: 'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED';
    message?: string;
}

// 구독 상태
export interface SubscriptionStatus {
    is_subscribed: boolean;
    subscription_end_date?: string;
    days_remaining?: number;
}
