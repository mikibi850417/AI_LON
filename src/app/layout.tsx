// src/app/layout.tsx
"use client";

import { useState } from "react";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 브라우저용 Supabase 클라이언트 생성 (한 번만)
  const [supabase] = useState(() => createPagesBrowserClient({
    cookieOptions: {
      name: "sb-auth-token",
      path: "/",
      sameSite: "lax",
      secure: true,
      domain: typeof window !== 'undefined' ? window.location.hostname : undefined
    }
  }));

  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* 세션 컨텍스트 제공 */}
        <SessionContextProvider supabaseClient={supabase}>
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {children}
            <Footer />
          </div>
        </SessionContextProvider>
      </body>
    </html>
  );
}