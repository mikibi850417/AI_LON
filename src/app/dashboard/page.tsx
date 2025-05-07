"use client";

import React from "react";
import HomeDashboard from "@/app/dashboard/home/page"; // ✅ 경로에 맞게 import
import DashboardIcon from '@mui/icons-material/Dashboard'; // Dashboard 아이콘 추가

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4" style={{
        color: '#2c3e50',
        padding: '16px 0',
        borderBottom: '2px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center'
      }}>
        <DashboardIcon style={{ marginRight: '8px', color: '#2c3e50' }} />
        Dashboard
      </h1>
      <HomeDashboard /> {/* 불러온 하위 대시보드 모듈 */}
    </div>
  );
}