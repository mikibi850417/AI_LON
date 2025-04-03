"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Box, TextField, Button, Chip } from "@mui/material";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const mapContainerStyle = { width: "100%", height: "500px" };
const defaultCenter = { lat: 37.5665, lng: 126.9780 };
const libraries: ("places")[] = ["places"];

interface CustomMapMouseEvent extends google.maps.MapMouseEvent {
  placeId?: string;
}

// API 베이스 URL 가져오기
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
};

export default function OnboardingPage() {
  const router = useRouter();

  // 사용자 정보 상태 (ID, 이메일, provider)
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userProvider, setUserProvider] = useState<string>("");

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [hotelAddress, setHotelAddress] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [hotelLatitude, setHotelLatitude] = useState<number | null>(null);
  const [hotelLongitude, setHotelLongitude] = useState<number | null>(null);
  // 경쟁호텔 선택 (최대 5개)
  const [selectedCompetitorHotels, setSelectedCompetitorHotels] = useState<string[]>([]);
  const [error, setError] = useState("");

  // 원본 데이터 상태 (변경 여부 비교용)
  const [originalHotelAddress, setOriginalHotelAddress] = useState("");
  const [originalHotelName, setOriginalHotelName] = useState("");
  const [originalCompetitorHotels, setOriginalCompetitorHotels] = useState<string[]>([]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // 로그인 세션 확인 및 사용자 정보 저장
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email);
        setUserProvider(session.user.app_metadata.provider || "email");
      } else {
        router.push("/auth/login");
      }
    };
    fetchSession();
  }, [router]);

  // 기존 사용자 정보 가져오기 (competitor_hotels, hotel_address, hotel_name)
  useEffect(() => {
    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("competitor_hotels, hotel_address, hotel_name")
        .eq("id", userId)
        .single();
      if (error) {
        console.error("사용자 데이터 조회 에러:", error);
        return;
      }
      if (data) {
        if (data.competitor_hotels) {
          setSelectedCompetitorHotels(data.competitor_hotels);
          setOriginalCompetitorHotels(data.competitor_hotels);
        }
        if (data.hotel_address) {
          setHotelAddress(data.hotel_address);
          setOriginalHotelAddress(data.hotel_address);
        }
        if (data.hotel_name) {
          setHotelName(data.hotel_name);
          setOriginalHotelName(data.hotel_name);
        }
      }
    };
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // Daum 우편번호 스크립트 동적 로드
  useEffect(() => {
    if (typeof window !== "undefined" && !window.daum) {
      const script = document.createElement("script");
      script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Daum 우편번호 팝업 열기 및 선택한 주소로 지도 이동 (줌 레벨 18)
  const openDaumPostcode = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function (data: any) {
          const roadAddress = data.roadAddress;
          setHotelAddress(roadAddress);
          if (map) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: roadAddress }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                const location = results[0].geometry.location;
                setHotelLatitude(location.lat());
                setHotelLongitude(location.lng());
                map.panTo(location);
                map.setZoom(18);
                if (marker) {
                  marker.setMap(null);
                }
                const newMarker = new google.maps.Marker({
                  position: location,
                  map: map,
                });
                setMarker(newMarker);
              } else {
                setError("주소를 찾을 수 없습니다. 다시 시도해주세요.");
                setTimeout(() => setError(""), 3000);
              }
            });
          }
        },
      }).open();
    } else {
      setError("우편번호 서비스를 불러올 수 없습니다.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // 지도 클릭 시 경쟁호텔 선택 (최대 5개) 및 토글 제거 처리
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const customEvent = e as CustomMapMouseEvent;
      if (customEvent.placeId && map) {
        const service = new google.maps.places.PlacesService(map);
        service.getDetails(
          {
            placeId: customEvent.placeId,
            fields: ["name", "types"],
          },
          (place, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              place &&
              place.types &&
              place.name
            ) {
              if (place.types.includes("lodging")) {
                // 토글: 이미 선택된 호텔이면 제거
                if (selectedCompetitorHotels.includes(place.name)) {
                  setSelectedCompetitorHotels((prev) =>
                    prev.filter((item) => item !== place.name)
                  );
                } else {
                  // 최대 5개 선택 제한
                  if (selectedCompetitorHotels.length >= 5) {
                    const infoWindow = new google.maps.InfoWindow({
                      content:
                        "<div style='color:red; font-weight:bold;'>최대 5개만 선택 가능합니다.</div>",
                      position: customEvent.latLng,
                    });
                    infoWindow.open(map);
                    setTimeout(() => infoWindow.close(), 2000);
                    return;
                  }
                  setSelectedCompetitorHotels((prev) => [...prev, place.name]);
                }
              }
            }
          }
        );
      }
    },
    [map, selectedCompetitorHotels]
  );

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  // 폼 제출: 변경된 부분만 업데이트
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!hotelAddress || !hotelName) {
      setError("호텔 주소와 호텔 이름을 입력해주세요.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!userId) {
      setError("사용자 정보를 확인할 수 없습니다.");
      return;
    }

    // 변경된 필드만 선택하여 업데이트할 데이터 구성
    const changedData: any = {};
    if (hotelAddress !== originalHotelAddress) {
      changedData.hotel_address = hotelAddress;
      changedData.hotel_latitude = hotelLatitude;
      changedData.hotel_longitude = hotelLongitude;
    }
    if (hotelName !== originalHotelName) {
      changedData.hotel_name = hotelName;
    }
    if (JSON.stringify(selectedCompetitorHotels) !== JSON.stringify(originalCompetitorHotels)) {
      changedData.competitor_hotels = selectedCompetitorHotels;
    }

    if (Object.keys(changedData).length === 0) {
      setError("변경된 데이터가 없습니다.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // competitor_hotels 필드가 변경된 경우 FastAPI API 호출 (LocalDB 업데이트)
    if (changedData.competitor_hotels) {
      try {
        const competitorResponse = await fetch(`${getApiBaseUrl()}/api/competitor-hotels/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId, hotels: selectedCompetitorHotels }),
        });
        const competitorData = await competitorResponse.json();
        if (!competitorResponse.ok) {
          setError(competitorData.detail || "경쟁 호텔 업데이트 에러");
          setTimeout(() => setError(""), 3000);
          return;
        }
      } catch (apiError) {
        setError("경쟁 호텔 API 호출 실패");
        setTimeout(() => setError(""), 3000);
        return;
      }
    }

    // Supabase의 users 테이블 업데이트 (변경된 데이터만)
    const { error: updateError } = await supabase
      .from("users")
      .update(changedData)
      .eq("id", userId);
    if (updateError) {
      setError("정보 업데이트 실패: " + updateError.message);
      setTimeout(() => setError(""), 3000);
    } else {
      router.push("/dashboard");
    }
  };

  if (loadError) return <p>🚨 지도 로드 실패</p>;
  if (!isLoaded) return <p>📍 지도를 불러오는 중...</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-center mb-6">회원 초기화 정보 입력</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form id="onboardingForm" onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <Box className="flex items-center gap-2">
            <TextField
              label="호텔 주소"
              value={hotelAddress}
              onChange={(e) => setHotelAddress(e.target.value)}
              fullWidth
              required
            />
            <Button variant="contained" onClick={openDaumPostcode}>
              우편번호 검색
            </Button>
          </Box>
          <TextField
            label="호텔 이름"
            value={hotelName}
            onChange={(e) => setHotelName(e.target.value)}
            fullWidth
            required
          />
          <Box>
            <p className="mb-2">경쟁 호텔 선택 (최대 5개)</p>
            {selectedCompetitorHotels.length > 0 &&
              selectedCompetitorHotels.map((hotel, index) => (
                <Chip
                  key={index}
                  label={hotel}
                  onDelete={() =>
                    setSelectedCompetitorHotels((prev) =>
                      prev.filter((item) => item !== hotel)
                    )
                  }
                  className="mr-2 mb-2"
                />
              ))}
          </Box>
        </form>
        <div className="mt-8">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={18}
            center={defaultCenter}
            onLoad={onMapLoad}
            onClick={handleMapClick}
            clickableIcons={true}
          />
        </div>
        <Box className="mt-8">
          <Button type="submit" form="onboardingForm" variant="contained" color="primary" fullWidth>
            정보 업데이트
          </Button>
        </Box>
      </div>
    </div>
  );
}
