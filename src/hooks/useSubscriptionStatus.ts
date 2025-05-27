import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface SubscriptionStatus {
    is_subscribed: boolean;
    subscription_end_date: string | null;
    isLoading: boolean;
    error: string | null;
}

export function useSubscriptionStatus() {
    const [status, setStatus] = useState<SubscriptionStatus>({
        is_subscribed: false,
        subscription_end_date: null,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        async function fetchSubscriptionStatus() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    throw new Error('User not authenticated');
                }

                const { data, error } = await supabase
                    .from('users')
                    .select('is_subscribed, subscription_end_date')
                    .eq('id', session.user.id)
                    .single();

                if (error) {
                    throw error;
                }

                setStatus({
                    is_subscribed: data.is_subscribed,
                    subscription_end_date: data.subscription_end_date,
                    isLoading: false,
                    error: null,
                });
            } catch (err) {
                setStatus({
                    is_subscribed: false,
                    subscription_end_date: null,
                    isLoading: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        }

        fetchSubscriptionStatus();
    }, []);

    return status;
}