// utils.ts

// API 베이스 URL
const getApiBaseUrl = (): string => {
    return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
};

// 가격 조회 API 함수 (크롤링 결과)
export const fetchHotelData = async (
    hotelNames: string[],
    start: string,
    end: string
) => {
    const API_BASE = getApiBaseUrl();
    const requests = hotelNames.map(async (hotelName) => {
        // 종료날짜를 포함하기 위해 명시적으로 include_end_date=true 파라미터 추가
        const url = `${API_BASE}/api/hotels/google_crawl?hotel_names=${encodeURIComponent(
            hotelName
        )}&start_date=${start}&end_date=${end}&include_end_date=true`;
        console.log("API 요청 URL:", url); // 디버깅용 로그 추가
        const response = await fetch(url, {
            headers: { accept: "application/json" },
            cache: "no-store" // 캐시 사용 안 함
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        console.log("API 응답 데이터:", json); // 응답 데이터 로깅
        let priceData: any[] = [];
        if (json[hotelName]) {
            priceData = json[hotelName];
        } else if (json.data) {
            priceData = json.data;
        } else if (Array.isArray(json)) {
            priceData = json;
        }
        return { hotelName, data: priceData };
    });
    return Promise.all(requests);
};

/**
 * 피벗 테이블 생성 함수
 * - data: API에서 받아온 개별 가격 데이터 배열 (각 행: { hotel_name, date, room_price, ... })
 * - 각 호텔별로 날짜별 최저가격(사이트 무관)을 계산하고,
 *   마지막 3행에는 각 날짜별 평균, 최대, 최솟값을 추가합니다.
 */
export function buildPivotTableFromEntries(data: any[]): { pivotRows: any[]; dates: string[] } {
    const hotels = Array.from(new Set(data.map((entry) => entry.hotel_name)));
    const datesSet = new Set<string>();
    data.forEach((entry) => datesSet.add(entry.date));
    const dates = Array.from(datesSet).sort();

    const pivotRows = hotels.map((hotel) => {
        const row: any = { id: hotel, hotelName: hotel };
        dates.forEach((date) => {
            const entries = data.filter(
                (entry) => entry.hotel_name === hotel && entry.date === date
            );
            row[date] = entries.length > 0 ? Math.min(...entries.map((e) => e.room_price)) : null;
        });
        return row;
    });

    const avgRow: any = { id: "avg", hotelName: "평균 가격" };
    const maxRow: any = { id: "max", hotelName: "최고 가격" };
    const minRow: any = { id: "min", hotelName: "최저 가격" };

    dates.forEach((date) => {
        const values = pivotRows.map((row) => row[date]).filter((v) => v !== null);
        if (values.length > 0) {
            const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
            avgRow[date] = Math.round(avg);
            maxRow[date] = Math.max(...values);
            minRow[date] = Math.min(...values);
        } else {
            avgRow[date] = null;
            maxRow[date] = null;
            minRow[date] = null;
        }
    });

    pivotRows.push(avgRow, maxRow, minRow);
    return { pivotRows, dates };
}

/**
 * Line 차트 데이터 생성 함수 (피벗 테이블의 모든 행 포함)
 * - 각 호텔별 최저가와 통계 행(평균, 최대, 최솟값)을 개별 데이터셋으로 생성합니다.
 */
export function computeLineChartDataAllRows(pivotRows: any[], dates: string[]) {
    const datasets = pivotRows.map((row, idx) => {
        // 통계 행에 대한 특별 색상 지정
        let color;
        if (row.hotelName === '평균 가격') color = '#2c3e50';
        else if (row.hotelName === '최고 가격') color = '#e74c3c';
        else if (row.hotelName === '최저 가격') color = '#2ecc71';
        else color = `hsl(${(idx * 60) % 360}, 70%, 50%)`;

        return {
            label: row.hotelName,
            data: dates.map((date) => row[date]),
            fill: false,
            // 통계 행은 점선 처리
            borderDash:
                row.id === "avg" || row.id === "max" || row.id === "min" ? [5, 5] : undefined,
            borderColor: color,
        };
    });
    return { labels: dates, datasets };
}