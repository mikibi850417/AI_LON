// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /dashboard 경로에 접근하는 경우
  if (pathname.startsWith('/dashboard')) {
    // 예시: Supabase가 인증 토큰을 저장하는 쿠키 이름 (설정에 맞게 변경 필요)
    const token = request.cookies.get('supabase-auth-token');
    if (!token) {
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