import React, { useState, useEffect } from "react";
import CommonHotelPredictPrice, { StatsInfo } from "@/lib/components/HotelPredictPrice";

// 사용자 지역 타입 정의
interface UserRegion {
    location_code: string;
    region: string;
}

// 피벗 테이블 행 타입 정의 (FastAPI 스타일)
interface PivotTableRow {
    hotel_name: string;
    hotelName?: string;
    id?: string;
    [date: string]: string | number | null | undefined;
}

interface HotelPredictPriceProps {
    pivotTableRows: PivotTableRow[];
    pivotTableDates: string[];
    userRegion: UserRegion | null;
}

export default function HotelPredictPrice({
    pivotTableRows,
    pivotTableDates,
    userRegion
}: HotelPredictPriceProps) {
    // 통계 정보 추출
    const [stats, setStats] = useState<StatsInfo>({
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        count: 0
    });

    // pivotTableRows와 pivotTableDates로부터 기본 정보 계산
    useEffect(() => {
        if (pivotTableRows.length > 0 && pivotTableDates.length > 0) {
            // 통계행(avg, min, max)을 제외한 실제 호텔 행 추출
            const hotelRows = pivotTableRows.filter(row => row.id && !['avg', 'max', 'min'].includes(row.id));

            // 최신 날짜 (마지막 날짜)
            const lastDate = pivotTableDates[pivotTableDates.length - 1];

            // 마지막 날짜의 모든 호텔 가격 수집
            const lastDatePrices = hotelRows
                .map(row => {
                    const price = row[lastDate];
                    return typeof price === 'number' ? price : null;
                })
                .filter((price): price is number => price !== null);

            if (lastDatePrices.length > 0) {
                const sortedPrices = lastDatePrices.sort((a, b) => a - b);
                const mean = sortedPrices.reduce((sum, price) => sum + price, 0) / sortedPrices.length;
                const median = sortedPrices[Math.floor(sortedPrices.length / 2)];

                setStats({
                    mean: Math.round(mean),
                    median,
                    min: Math.min(...sortedPrices),
                    max: Math.max(...sortedPrices),
                    count: sortedPrices.length
                });
            }
        }
    }, [pivotTableRows, pivotTableDates]);

    // 특정 날짜의 가격 목록 추출 함수
    const getPricesForDate = (date: string): number[] => {
        if (!pivotTableRows.length) return [];

        // 통계 행(avg, max, min)을 제외한 실제 호텔 행 추출
        const hotelRows = pivotTableRows.filter(row => row.id && !['avg', 'max', 'min'].includes(row.id));

        // 선택된 날짜의 가격 데이터 추출 (null이 아닌 값만)
        return hotelRows
            .map(row => {
                const price = row[date];
                return typeof price === 'number' ? price : null;
            })
            .filter((price): price is number => price !== null)
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
