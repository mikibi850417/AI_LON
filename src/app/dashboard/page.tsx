"use client";

import React from "react";
import HomeDashboard from "@/app/dashboard/home/page"; // ✅ 경로에 맞게 import

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">📊 전체 대시보드</h1>
      <HomeDashboard /> {/* 불러온 하위 대시보드 모듈 */}
    </div>
  );
}