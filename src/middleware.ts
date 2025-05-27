import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    console.log('Middleware triggered for path:', pathname);

    // /dashboard 경로에 접근하는 경우
    if (pathname.startsWith('/dashboard')) {
        const response = NextResponse.next();
        const supabase = createMiddlewareClient({ req: request, res: response });

        // 쿠키 디버깅 로그 추가
        const cookies = request.headers.get('cookie');
        console.log('Request cookies:', cookies);

        // Supabase 세션 디버깅 로그 추가
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            console.log('Supabase session:', session);

            if (!session?.user) {
                console.log('No user session found, redirecting to /auth/login');
                const url = request.nextUrl.clone();
                url.pathname = '/auth/login';
                return NextResponse.redirect(url);
            }

            const { data: userData, error } = await supabase
                .from('users')
                .select('is_subscribed')
                .eq('id', session.user.id)
                .single();

            console.log('User data:', userData, 'Error:', error);

            if (error || !userData?.is_subscribed) {
                console.log('User is not subscribed, redirecting to /auth/login');
                const url = request.nextUrl.clone();
                url.pathname = '/auth/login';
                return NextResponse.redirect(url);
            }

            console.log('User is subscribed, allowing access to /dashboard');
        } catch (err) {
            console.error('Error during middleware execution:', err);
            const url = request.nextUrl.clone();
            url.pathname = '/auth/login';
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'],
};