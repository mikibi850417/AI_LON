import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
        console.log('Middleware triggered for path:', pathname);
    }

    // /dashboard 경로에 접근하는 경우
    if (pathname.startsWith('/dashboard')) {
        let response = NextResponse.next({
            request: {
                headers: request.headers,
            },
        });

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        const cookie = request.cookies.get(name);
                        // 개발 환경에서만 로깅하고, 인증 토큰 쿠키는 값이 있을 때만 로깅
                        if (isDevelopment && cookie?.value && !name.includes('auth-token')) {
                            console.log(`Getting cookie ${name}:`, cookie.value);
                        }
                        return cookie?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        if (isDevelopment && !name.includes('auth-token')) {
                            console.log(`Setting cookie ${name}`);
                        }
                        request.cookies.set({
                            name,
                            value,
                            ...options,
                        });
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        });
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        });
                    },
                    remove(name: string, options: CookieOptions) {
                        if (isDevelopment && !name.includes('auth-token')) {
                            console.log(`Removing cookie ${name}`);
                        }
                        request.cookies.set({
                            name,
                            value: '',
                            ...options,
                        });
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        });
                        response.cookies.set({
                            name,
                            value: '',
                            ...options,
                        });
                    },
                },
            }
        );

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (isDevelopment && session) {
                console.log('User authenticated successfully');
            }

            if (!session?.user) {
                if (isDevelopment) {
                    console.log('No user session found, redirecting to /auth/login');
                }
                const url = request.nextUrl.clone();
                url.pathname = '/auth/login';
                return NextResponse.redirect(url);
            }

            const { data: userData, error } = await supabase
                .from('users')
                .select('is_subscribed')
                .eq('id', session.user.id)
                .single();

            if (error || !userData?.is_subscribed) {
                if (isDevelopment) {
                    console.log('User is not subscribed, redirecting to /auth/login');
                }
                const url = request.nextUrl.clone();
                url.pathname = '/auth/login';
                return NextResponse.redirect(url);
            }

            return response;
        } catch (err) {
            if (isDevelopment) {
                console.error('Error during middleware execution:', err);
            }
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