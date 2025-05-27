import React, { useState, useEffect } from "react";
import CommonHotelPredictPrice, { StatsInfo } from "@/lib/components/HotelPredictPrice";

// 사용자 지역 타입 정의
interface UserRegion {
    location_code: string;
    region: string;
}

interface HotelPredictPriceProps {
    pivotTableRows: any[]; // HotelDataVisualization에서 사용된 데이터 타입
    pivotTableDates: string[]; // HotelDataVisualization에서 사용된 데이터 타입
    userRegion: UserRegion | null;
}

export default function HotelPredictPrice({
    pivotTableRows,
    pivotTableDates,
    userRegion
}: HotelPredictPriceProps) {
    // 통계 정보 추출
    const [stats, setStats] = useState<StatsInfo>({
        hotels: [],
        hotelCount: 0,
        dateCount: 0,
        avgPrice: null,
        minPrice: null,
        maxPrice: null,
        lastDate: null
    });

    // pivotTableRows와 pivotTableDates로부터 기본 정보 계산
    useEffect(() => {
        if (pivotTableRows.length > 0 && pivotTableDates.length > 0) {
            // 통계행(avg, min, max)을 제외한 실제 호텔 행 추출
            const hotelRows = pivotTableRows.filter(row => !['avg', 'max', 'min'].includes(row.id));

            // 최신 날짜 (마지막 날짜)
            const lastDate = pivotTableDates[pivotTableDates.length - 1];

            // 모든 호텔의 이름 추출
            const hotels = hotelRows.map(row => row.hotelName);

            // 마지막 날짜의 평균/최소/최대 가격 계산
            const avgRow = pivotTableRows.find(row => row.id === 'avg');
            const minRow = pivotTableRows.find(row => row.id === 'min');
            const maxRow = pivotTableRows.find(row => row.id === 'max');

            setStats({
                hotels,
                hotelCount: hotelRows.length,
                dateCount: pivotTableDates.length,
                avgPrice: avgRow ? avgRow[lastDate] : null,
                minPrice: minRow ? minRow[lastDate] : null,
                maxPrice: maxRow ? maxRow[lastDate] : null,
                lastDate
            });
        }
    }, [pivotTableRows, pivotTableDates]);

    // 특정 날짜의 가격 목록 추출 함수
    const getPricesForDate = (date: string): number[] => {
        if (!pivotTableRows.length) return [];

        // 통계 행(avg, max, min)을 제외한 실제 호텔 행 추출
        const hotelRows = pivotTableRows.filter(row => !['avg', 'max', 'min'].includes(row.id));

        // 선택된 날짜의 가격 데이터 추출 (null이 아닌 값만)
        return hotelRows
            .map(row => row[date])
            .filter(price => price !== null)
            .sort((a, b) => a - b);
    };

    // 공통 컴포넌트 활용하여 렌더링
    return (
        <CommonHotelPredictPrice
            dates={pivotTableDates}
            userRegion={userRegion}
            getPricesForDate={getPricesForDate}
            title="호텔 가격 예측"
            statsInfo={stats} // 공통 컴포넌트의 renderDataInfoComponent 사용
        />
    );
}
