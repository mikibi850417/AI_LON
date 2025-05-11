import axios from 'axios';

// API 기본 URL 설정 (환경 변수 사용을 권장합니다)
const BASE_URL = "http://ailon.iptime.org:8000/api";

// --- 가격 예측 관련 ---
interface PricePredictionPayload {
    date: string;
    region: string;
    address: string;
    occupancy: number;
    risk: number;
    prices: number[];
}

interface PricePredictionResponse {
    predicted_price: number;
    [key: string]: any;
}

/**
 * 가격 예측 API를 호출하는 함수
 * @param payload - 가격 예측에 필요한 데이터
 * @returns 예측 결과 Promise
 */
export async function getPredictPrice(payload: PricePredictionPayload): Promise<PricePredictionResponse> { // 함수 이름 변경
    const url = `${BASE_URL}/price/predict`;
    console.log("Requesting price prediction with payload:", payload);

    try {
        const response = await axios.post<PricePredictionResponse>(url, payload, {
            headers: { "Content-Type": "application/json" },
        });
        console.log("Price prediction API response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Price Prediction API failed:", error);
        // ... (기존 에러 처리 로직) ...
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.error("Status Code:", error.response.status);
                console.error("Response Data:", error.response.data);
                throw new Error(`API Error ${error.response.status}: ${JSON.stringify(error.response.data) || error.message}`);
            } else if (error.request) {
                console.error("No response received:", error.request);
                throw new Error("API request was made but no response was received.");
            } else {
                console.error("Error setting up request:", error.message);
                throw new Error(`Error setting up API request: ${error.message}`);
            }
        } else {
            console.error("An unexpected error occurred:", error);
            throw new Error("An unexpected error occurred during price prediction.");
        }
    }
}

// --- 가격 계절성 분석 관련 ---
interface SeasonalityPayload {
    date: string;
    region: string;
    address: string;
}

interface SeasonalityResponse {
    seasonality_index: number;
    [key: string]: any;
}

/**
 * 가격 계절성 분석 API를 호출하는 함수
 * @param payload - 계절성 분석에 필요한 데이터
 * @returns 분석 결과 Promise
 */
export async function getSeasonality(payload: SeasonalityPayload): Promise<SeasonalityResponse> {
    const url = `${BASE_URL}/price/seasonality`;
    console.log("Requesting price seasonality with payload:", payload);

    try {
        const response = await axios.post<SeasonalityResponse>(url, payload, {
            headers: { "Content-Type": "application/json" },
        });
        console.log("Price seasonality API response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Price Seasonality API failed:", error);
        // ... (기존 에러 처리 로직) ...
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.error("Status Code:", error.response.status);
                console.error("Response Data:", error.response.data);
                throw new Error(`API Error ${error.response.status}: ${JSON.stringify(error.response.data) || error.message}`);
            } else if (error.request) {
                console.error("No response received:", error.request);
                throw new Error("API request was made but no response was received.");
            } else {
                console.error("Error setting up request:", error.message);
                throw new Error(`Error setting up API request: ${error.message}`);
            }
        } else {
            console.error("An unexpected error occurred:", error);
            throw new Error("An unexpected error occurred during seasonality analysis.");
        }
    }
}