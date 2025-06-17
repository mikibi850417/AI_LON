"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, TextField, Button, Chip, Typography, Autocomplete } from "@mui/material";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { Card, CardContent } from "@mui/material";
import Image from "next/image";

const mapContainerStyle = { width: "100%", height: "500px" };
const defaultCenter = { lat: 37.5665, lng: 126.9780 };
const libraries: ("places")[] = ["places"];

interface CustomMapMouseEvent extends google.maps.MapMouseEvent {
  placeId?: string;
}

// API 베이스 URL 가져오기 함수 수정
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
};

// Daum 우편번호 타입 정의 추가
// FastAPI 스타일 타입 정의
interface PostcodeOptions {
  oncomplete?: (data: PostcodeResult) => void;
  onclose?: () => void;
  width?: string | number;
  height?: string | number;
}

interface PostcodeResult {
  address: string;
  zonecode: string;
  roadAddress?: string;
  jibunAddress?: string;
}

declare global {
  interface Window {
    daum: {
      Postcode: new (options: PostcodeOptions) => {
        open: () => void;
      };
    };
  }
}

export default function OnboardingPage() {
  const router = useRouter();

  // 사용자 정보 상태 (ID, 이메일, provider)
  const [userId, setUserId] = useState<string>("");
  const [, setUserEmail] = useState<string>("");
  const [, setUserProvider] = useState<string>("");

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [hotelAddress, setHotelAddress] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [hotelLatitude, setHotelLatitude] = useState<number | null>(null);
  const [hotelLongitude, setHotelLongitude] = useState<number | null>(null);
  // 경쟁호텔 선택 (최대 5개)
  const [selectedCompetitorHotels, setSelectedCompetitorHotels] = useState<string[]>([]);
  const [error, setError] = useState("");

  // 호텔 검색 관련 상태 추가
  const [searchValue, setSearchValue] = useState<string>("");
  const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // 원본 데이터 상태 (변경 여부 비교용)
  const [, setOriginalHotelAddress] = useState("");
  const [, setOriginalHotelName] = useState("");
  const [, setOriginalCompetitorHotels] = useState<string[]>([]);

  // 새로운 상태 추가
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // Initialize Google Maps Autocomplete service
  useEffect(() => {
    if (isLoaded && window.google) {
      autocompleteRef.current = new google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  // Initialize Google Maps Places service
  useEffect(() => {
    if (map) {
      placesServiceRef.current = new google.maps.places.PlacesService(map);
    }
  }, [map]);

  // 로그인 세션 확인 및 사용자 정보 저장
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || ""); // null/undefined 처리
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
      try {
        console.log("사용자 데이터 조회 시작, userId:", userId);

        if (!userId) {
          console.log("userId가 없어 데이터 조회를 건너뜁니다.");
          return;
        }

        // 1. users 테이블에서 competitor_hotels, hotel_name 조회
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("competitor_hotels, hotel_name")
          .eq("id", userId)
          .single();

        if (userError) {
          console.error("사용자 데이터 조회 에러:", userError);
          return;
        }

        console.log("users 테이블 조회 결과:", userData);

        if (userData) {
          if (userData.competitor_hotels) {
            setSelectedCompetitorHotels(userData.competitor_hotels);
            setOriginalCompetitorHotels(userData.competitor_hotels);
          }
          if (userData.hotel_name) {
            setHotelName(userData.hotel_name);
            setOriginalHotelName(userData.hotel_name);
          }
        }

        // 2. user_address_info 테이블에서 address, latitude, longitude 조회
        const { data: addressData, error: addressError } = await supabase
          .from("user_address_info")
          .select("address, latitude, longitude")
          .eq("user_id", userId)
          .single();

        if (addressError) {
          // PostgreSQL 코드 P0002는 "no_data_found" 오류로, 데이터가 없는 경우입니다.
          // 이 경우는 정상적인 상황일 수 있으므로 무시합니다.
          if (addressError.code !== "PGRST116") {
            console.error("주소 데이터 조회 에러:", addressError);
          } else {
            console.log("주소 데이터가 아직 없습니다.");
          }
          return;
        }

        console.log("user_address_info 테이블 조회 결과:", addressData);

        if (addressData) {
          if (addressData.address) {
            setHotelAddress(addressData.address);
            setOriginalHotelAddress(addressData.address);
          }
          if (addressData.latitude) {
            setHotelLatitude(addressData.latitude);
          }
          if (addressData.longitude) {
            setHotelLongitude(addressData.longitude);
          }
        }
      } catch (error) {
        console.error("데이터 조회 중 예외 발생:", error);
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
        oncomplete: function (data: PostcodeResult) {
          const roadAddress = data.roadAddress || data.address;
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
              place.name // 이름이 존재하는지 확인
            ) {
              const hotelName = place.name; // 로컬 변수에 할당하여 타입 안정성 확보

              if (place.types.includes("lodging")) {
                // 토글: 이미 선택된 호텔이면 제거
                if (selectedCompetitorHotels.includes(hotelName)) {
                  setSelectedCompetitorHotels((prev) =>
                    prev.filter((item) => item !== hotelName)
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
                  // 타입 안전하게 수정
                  setSelectedCompetitorHotels((prev) => [...prev, hotelName]);
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

  // 검색 결과 처리 함수 추가
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    if (value.length > 2 && autocompleteRef.current && map) {
      const center = map.getCenter();
      if (center) {
        autocompleteRef.current.getPlacePredictions(
          {
            input: value,
            types: ["lodging"],
            location: new google.maps.LatLng(center.lat(), center.lng()),
            radius: 50000,
          },
          (predictions, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              setSearchResults(predictions);
            } else {
              setSearchResults([]);
            }
          }
        );
      }
    } else {
      setSearchResults([]);
    }
  };

  // 호텔 상세 정보 가져오기
  const getPlaceDetails = (placeId: string) => {
    if (!placesServiceRef.current) return;
    placesServiceRef.current.getDetails(
      {
        placeId: placeId,
        fields: ["name", "geometry", "types"],
      },
      (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place &&
          place.name &&
          place.geometry?.location
        ) {
          const hotelName = place.name; // 로컬 변수에 할당하여 타입 안정성 확보

          // 최대 5개 선택 제한
          if (selectedCompetitorHotels.length >= 5 && !selectedCompetitorHotels.includes(hotelName)) {
            setError("경쟁 호텔은 최대 5개까지만 선택 가능합니다.");
            setTimeout(() => setError(""), 3000);
            return;
          }

          // 토글: 이미 선택된 호텔이면 제거, 아니면 추가
          setSelectedCompetitorHotels((prev) => {
            if (prev.includes(hotelName)) {
              return prev.filter(item => item !== hotelName);
            } else {
              return [...prev, hotelName];
            }
          });

          // 지도 이동
          if (map && place.geometry?.location) {
            map.panTo(place.geometry.location);
            map.setZoom(18);
          }
        }
      }
    );
  };

  // 검색 결과 선택 처리
  const handleSearchResultSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (prediction.place_id) {
      getPlaceDetails(prediction.place_id);
    }
    setSearchValue("");
    setSearchResults([]);
  };

  // 호텔 제거 핸들러
  const handleRemoveHotel = (hotel: string) => {
    setSelectedCompetitorHotels((prev) => {
      return prev.filter(item => item !== hotel);
    });
  };

  // 내 호텔 정보만 저장하는 함수 수정
  const saveMyHotelInfo = async (e: React.FormEvent) => {
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

    try {
      console.log("내 호텔 정보 저장 시작:", {
        userId,
        hotelAddress,
        hotelName,
        hotelLatitude,
        hotelLongitude
      });

      // 지역 및 위치 코드 정보 가져오기 (FastAPI 호출)
      let region = "UNKNOWN";
      let location_code = "UNKNOWN";

      try {
        const apiBaseUrl = getApiBaseUrl();
        console.log("API Base URL:", apiBaseUrl); // URL 로깅 추가

        const response = await fetch(`${apiBaseUrl}/api/onboarding/input-postprocess/address`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address: hotelAddress }),
        });

        console.log("API Response Status:", response.status); // 응답 상태 로깅 추가

        if (response.ok) {
          const result = await response.json();
          console.log("주소 처리 API 응답:", result);
          location_code = result.location || "UNKNOWN";
          region = result.region || "UNKNOWN";
        } else {
          const errorText = await response.text();
          console.error("주소 처리 API 오류:", response.status, errorText);
          throw new Error(`API 요청 실패: ${response.status} ${errorText}`);
        }
      } catch (apiError: unknown) {
        console.error("주소 처리 API 호출 실패:", apiError);
        throw new Error(`주소 처리 API 호출 실패: ${apiError instanceof Error ? apiError.message : '알 수 없는 오류'}`);
      }

      // 주소 정보 업데이트
      const { error: addressError } = await supabase
        .from("user_address_info")
        .upsert({
          user_id: userId,
          address: hotelAddress,
          latitude: hotelLatitude,
          longitude: hotelLongitude,
          location_code: location_code,
          region: region
        }, { onConflict: 'user_id' });

      if (addressError) {
        console.error("주소 정보 업데이트 실패:", addressError);
        throw new Error(`주소 정보 업데이트 실패: ${addressError.message}`);
      }

      // 2. 호텔 이름 업데이트 (users 테이블)
      if (hotelName) {
        console.log("호텔 이름 업데이트 시도:", {
          hotel_name: hotelName
        });

        const { error: userError } = await supabase
          .from("users")
          .update({ hotel_name: hotelName })
          .eq("id", userId);

        if (userError) {
          console.error("호텔 이름 업데이트 실패:", userError);
          setError("호텔 이름 업데이트 실패: " + userError.message);
          setTimeout(() => setError(""), 3000);
          return;
        }
        console.log("호텔 이름 업데이트 성공");
      }

      // 3. 내 호텔을 경쟁 호텔 목록에 추가 (이미 있으면 추가하지 않음)
      if (!selectedCompetitorHotels.includes(hotelName)) {
        setSelectedCompetitorHotels(prev => [...prev, hotelName]);
      }

      // 원본 데이터 업데이트
      setOriginalHotelAddress(hotelAddress);
      setOriginalHotelName(hotelName);

      // 성공 메시지 표시
      setError("내 호텔 정보가 성공적으로 저장되었습니다.");
      setTimeout(() => setError(""), 3000);

    } catch (error: unknown) {
      console.error("내 호텔 정보 저장 오류:", error);
      setError(error instanceof Error ? error.message : "처리 중 오류가 발생했습니다.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // 경쟁 호텔 정보만 저장하는 함수 (기존 handleSubmit 함수 수정)
  const saveCompetitorHotels = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId) {
      setError("사용자 정보를 확인할 수 없습니다.");
      return;
    }

    if (selectedCompetitorHotels.length === 0) {
      setError("선택된 경쟁 호텔이 없습니다.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      console.log("경쟁 호텔 정보 저장 시작:", {
        userId,
        selectedCompetitorHotels
      });

      // 1. 경쟁 호텔 업데이트 (users 테이블)
      console.log("경쟁 호텔 업데이트 시도:", {
        competitor_hotels: selectedCompetitorHotels
      });

      const { error: userError } = await supabase
        .from("users")
        .update({
          competitor_hotels: selectedCompetitorHotels,
          is_initialized: true
        })
        .eq("id", userId);

      if (userError) {
        console.error("경쟁 호텔 업데이트 실패:", userError);
        setError("경쟁 호텔 업데이트 실패: " + userError.message);
        setTimeout(() => setError(""), 3000);
        return;
      }
      console.log("경쟁 호텔 업데이트 성공");

      // 2. FastAPI API 호출 (LocalDB 업데이트)
      try {
        console.log("경쟁 호텔 API 호출 시도:", {
          user_id: userId,
          hotels: selectedCompetitorHotels
        });

        const competitorResponse = await fetch(`${getApiBaseUrl()}/api/competitor-hotels/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId, hotels: selectedCompetitorHotels }),
        });

        if (competitorResponse.ok) {
          const competitorData = await competitorResponse.json();
          console.log("경쟁 호텔 API 응답:", competitorData);
        } else {
          const errorData = await competitorResponse.json();
          console.error("경쟁 호텔 API 오류:", errorData);
          setError(errorData.detail || "경쟁 호텔 업데이트 에러");
          setTimeout(() => setError(""), 3000);
          return;
        }
      } catch (apiError: unknown) {
        console.error("경쟁 호텔 API 호출 실패:", apiError);
        setError("경쟁 호텔 API 호출 실패: " + (apiError instanceof Error ? apiError.message : "알 수 없는 오류"));
        setTimeout(() => setError(""), 3000);
        return;
      }

      // 원본 데이터 업데이트
      setOriginalCompetitorHotels([...selectedCompetitorHotels]);

      // 성공 후 환영 화면 표시
      setShowWelcomeScreen(true);

    } catch (error: unknown) {
      console.error("경쟁 호텔 정보 저장 오류:", error);
      setError("처리 중 오류가 발생했습니다: " + (error instanceof Error ? error.message : "알 수 없는 오류"));
      setTimeout(() => setError(""), 3000);
    }
  };

  // 대시보드로 이동하는 함수
  const goToDashboard = () => {
    console.log("대시보드로 이동 시도");
    window.location.href = "/dashboard";
  };

  if (loadError) return <p>🚨 지도 로드 실패</p>;
  if (!isLoaded) return <p>📍 지도를 불러오는 중...</p>;

  // 환영 화면 렌더링
  if (showWelcomeScreen) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: '#f5f7ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4
      }}>
        <Card sx={{
          maxWidth: '700px',
          width: '100%',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            {/* 로고 섹션 */}
            <Box sx={{ mb: 4 }}>
              <Image
                src="/intelligentlon.png"
                alt="Intelligent LON 로고"
                width={200}
                height={67}
                style={{ 
                  margin: '0 auto',
                  objectFit: 'contain'
                }}
              />
            </Box>
            
            {/* 성공 아이콘과 제목 */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <CheckCircleIcon sx={{ color: '#10b981', fontSize: '2.5rem' }} />
              <Typography variant="h4" sx={{
                fontWeight: 'bold',
                color: '#2c3e50',
                fontSize: { xs: '1.5rem', sm: '2rem' }
              }}>
                설정이 완료되었습니다!
              </Typography>
            </Box>
            
            <Typography variant="h6" sx={{
              color: '#64748b',
              mb: 4,
              lineHeight: 1.6,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              L.O.N이 경쟁 호텔 데이터를 수집하고 분석을 시작합니다
            </Typography>

            {/* 기능 카드들 */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2,
              mb: 4
            }}>
              <Card sx={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '12px',
                p: 2
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <AutorenewIcon sx={{ color: '#0ea5e9', fontSize: '2rem' }} />
                  <CheckCircleIcon sx={{ color: '#10b981', fontSize: '1.5rem' }} />
                  <Typography variant="body2" sx={{ 
                    color: '#0ea5e9', 
                    fontWeight: 500, 
                    textAlign: 'center' 
                  }}>
                    실시간 가격 모니터링
                  </Typography>
                </Box>
              </Card>
              
              <Card sx={{
                backgroundColor: '#faf5ff',
                border: '1px solid #8b5cf6',
                borderRadius: '12px',
                p: 2
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon sx={{ color: '#8b5cf6', fontSize: '2rem' }} />
                  <CheckCircleIcon sx={{ color: '#10b981', fontSize: '1.5rem' }} />
                  <Typography variant="body2" sx={{ 
                    color: '#8b5cf6', 
                    fontWeight: 500, 
                    textAlign: 'center' 
                  }}>
                    시장 동향 분석
                  </Typography>
                </Box>
              </Card>
              
              <Card sx={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #10b981',
                borderRadius: '12px',
                p: 2
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <SmartToyIcon sx={{ color: '#10b981', fontSize: '2rem' }} />
                  <CheckCircleIcon sx={{ color: '#10b981', fontSize: '1.5rem' }} />
                  <Typography variant="body2" sx={{ 
                    color: '#10b981', 
                    fontWeight: 500, 
                    textAlign: 'center' 
                  }}>
                    AI 가격 최적화
                  </Typography>
                </Box>
              </Card>
            </Box>
            
            {/* 정보 텍스트 */}
            <Box sx={{
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '12px',
              p: 3,
              mb: 4
            }}>
              <Typography variant="body1" sx={{
                color: '#ea580c',
                mb: 2,
                fontWeight: 600
              }}>
                ⏳ 데이터 수집 및 분석 진행 중
              </Typography>
              <Typography variant="body2" sx={{
                color: '#9a3412',
                mb: 2,
                lineHeight: 1.6
              }}>
                경쟁 호텔의 가격 정보를 수집하고 AI 분석 모델을 준비하고 있습니다.
                <br />
                <strong>5분에서 최대 15분</strong>까지 소요되며, 완료 전까지는 대시보드에 일부 데이터가 표시되지 않을 수 있습니다.
              </Typography>
              <Typography variant="body2" sx={{
                color: '#1e40af',
                mb: 1,
                fontWeight: 500
              }}>
                🙏 고객님께 양해 말씀드립니다
              </Typography>
              <Typography variant="body2" sx={{
                color: '#3730a3',
                lineHeight: 1.5
              }}>
                정확하고 신뢰할 수 있는 분석을 위해 초기 설정 시간이 필요합니다.
                <br />
                잠시만 기다려 주시면 완성된 대시보드를 이용하실 수 있습니다.
              </Typography>
            </Box>
            
            {/* 대시보드로 이동 버튼 */}
            <Button
              variant="contained"
              onClick={goToDashboard}
              sx={{
                backgroundColor: '#2c3e50',
                '&:hover': {
                  backgroundColor: '#34495e',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 14px rgba(44, 62, 80, 0.3)'
                },
                borderRadius: '12px',
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                transition: 'all 0.3s ease'
              }}
            >
              대시보드 이동
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-center mb-6" style={{
          color: '#2c3e50',
          padding: '16px 0',
          borderBottom: '2px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>회원 정보 입력</h2>

        {error && (
          <Box sx={{
            backgroundColor: error.includes("성공") ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
            color: error.includes("성공") ? '#2ecc71' : '#e74c3c',
            p: 2,
            borderRadius: 2,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {error}
          </Box>
        )}

        {/* 내 호텔 정보 섹션 */}
        <Box sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          backgroundColor: 'white',
          mb: 4
        }}>
          <Box sx={{
            p: 3,
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, #2c3e50 0%, #34495e 100%)',
            color: 'white'
          }}>
            <h2 className="text-lg font-semibold" style={{ color: 'white' }}>
              내 호텔 정보
            </h2>
          </Box>

          <form id="myHotelForm" onSubmit={saveMyHotelInfo}>
            <Box sx={{ p: 3 }}>
              <Box className="flex items-center gap-2 mb-3">
                <TextField
                  label="호텔 주소"
                  value={hotelAddress}
                  onChange={(e) => setHotelAddress(e.target.value)}
                  fullWidth
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      '&:hover fieldset': {
                        borderColor: '#2c3e50',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#2c3e50',
                      },
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={openDaumPostcode}
                  sx={{
                    backgroundColor: '#2c3e50',
                    '&:hover': {
                      backgroundColor: '#34495e',
                    },
                    borderRadius: '8px',
                    textTransform: 'none',
                  }}
                >
                  우편번호 검색
                </Button>
              </Box>

              <Autocomplete
                freeSolo
                disableClearable
                options={searchResults}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.description
                }
                inputValue={hotelName}
                onInputChange={(_, newValue) => setHotelName(newValue)}
                onChange={(_, newValue) => {
                  if (typeof newValue === "string") return;
                  if (newValue && newValue.place_id) {
                    // 호텔 상세 정보 가져오기
                    if (placesServiceRef.current) {
                      placesServiceRef.current.getDetails(
                        {
                          placeId: newValue.place_id,
                          fields: ["name", "geometry", "formatted_address"],
                        },
                        (place, status) => {
                          if (
                            status === google.maps.places.PlacesServiceStatus.OK &&
                            place &&
                            place.name &&
                            place.geometry?.location
                          ) {
                            // 호텔 이름 설정
                            setHotelName(place.name);

                            // 주소가 있으면 설정
                            if (place.formatted_address) {
                              setHotelAddress(place.formatted_address);
                            }

                            // 위도/경도 설정
                            if (place.geometry?.location) {
                              setHotelLatitude(place.geometry.location.lat());
                              setHotelLongitude(place.geometry.location.lng());

                              // 지도 이동
                              if (map) {
                                map.panTo(place.geometry.location);
                                map.setZoom(18);

                                // 마커 설정
                                if (marker) {
                                  marker.setMap(null);
                                }
                                const newMarker = new google.maps.Marker({
                                  position: place.geometry.location,
                                  map: map,
                                });
                                setMarker(newMarker);
                              }
                            }
                          }
                        }
                      );
                    }
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="호텔 이름(검색을 통해 선택)"
                    fullWidth
                    required
                    onChange={(e) => {
                      const value = e.target.value;
                      setHotelName(value);
                      if (value.length > 2 && autocompleteRef.current && map) {
                        const center = map.getCenter();
                        if (center) {
                          autocompleteRef.current.getPlacePredictions(
                            {
                              input: value,
                              types: ["lodging"],
                              location: new google.maps.LatLng(center.lat(), center.lng()),
                              radius: 50000,
                            },
                            (predictions, status) => {
                              if (
                                status === google.maps.places.PlacesServiceStatus.OK &&
                                predictions
                              ) {
                                setSearchResults(predictions);
                              } else {
                                setSearchResults([]);
                              }
                            }
                          );
                        }
                      } else {
                        setSearchResults([]);
                      }
                    }}
                    InputProps={{
                      ...params.InputProps,
                      type: "search",
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '&:hover fieldset': {
                          borderColor: '#2c3e50',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2c3e50',
                        },
                      }
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.place_id}>
                    {option.description}
                  </li>
                )}
              />

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    backgroundColor: '#2c3e50',
                    '&:hover': {
                      backgroundColor: '#34495e',
                    },
                    borderRadius: '8px',
                    padding: '8px 16px',
                    textTransform: 'none',
                    fontWeight: 'bold',
                  }}
                >
                  내 호텔 정보 저장
                </Button>
              </Box>
            </Box>
          </form>
        </Box>

        {/* 경쟁 호텔 선택 섹션 */}
        <Box sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          backgroundColor: 'white',
          position: 'relative'
        }}>
          <Box sx={{
            p: 3,
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, #2c3e50 0%, #34495e 100%)',
            color: 'white'
          }}>
            <h2 className="text-lg font-semibold" style={{ color: 'white' }}>
              경쟁 호텔 선택 (최대 5개)
            </h2>
          </Box>

          <form id="competitorHotelsForm" onSubmit={saveCompetitorHotels}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
              <Autocomplete
                freeSolo
                disableClearable
                options={searchResults}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.description
                }
                inputValue={searchValue}
                onInputChange={(_, newValue) => setSearchValue(newValue)}
                onChange={(_, newValue) => {
                  if (typeof newValue === "string") return;
                  if (newValue) handleSearchResultSelect(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="호텔 이름으로 검색"
                    fullWidth
                    onChange={handleSearchChange}
                    InputProps={{
                      ...params.InputProps,
                      type: "search",
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '&:hover fieldset': {
                          borderColor: '#2c3e50',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2c3e50',
                        },
                      }
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.place_id}>
                    {option.description}
                  </li>
                )}
              />
            </Box>

            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={18}
              center={defaultCenter}
              onLoad={onMapLoad}
              onClick={handleMapClick}
              clickableIcons={true}
            />

            {/* 지도 위에 오버랩되는 선택된 호텔 목록 패널 */}
            <Box
              sx={{
                position: "absolute",
                top: 130,
                right: 10,
                width: "300px",
                maxHeight: "400px",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: 2,
                boxShadow: 3,
                p: 2,
                overflowY: "auto",
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#c1c1c1',
                  borderRadius: '10px',
                  '&:hover': {
                    background: '#a1a1a1',
                  },
                },
              }}
            >
              <Box sx={{ mb: 2, fontWeight: 'bold', color: '#2c3e50' }}>
                선택된 호텔
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {selectedCompetitorHotels.length > 0 ? (
                  // 내 호텔을 첫 번째로 정렬하고 나머지 호텔을 알파벳 순으로 정렬
                  [...selectedCompetitorHotels]
                    .sort((a, b) => {
                      // 내 호텔이면 항상 첫 번째로
                      if (a === hotelName) return -1;
                      if (b === hotelName) return 1;
                      // 그 외에는 알파벳 순으로 정렬
                      return a.localeCompare(b);
                    })
                    .map((hotel, index) => (
                      <Chip
                        key={index}
                        label={hotel}
                        onDelete={() => handleRemoveHotel(hotel)}
                        sx={{
                          my: 0.5,
                          backgroundColor: hotel === hotelName ? '#e74c3c' : '#2c3e50',
                          color: "white",
                          fontWeight: hotel === hotelName ? 'bold' : 'normal',
                          border: hotel === hotelName ? '2px solid #f39c12' : 'none',
                          '&:hover': {
                            backgroundColor: hotel === hotelName ? '#c0392b' : '#34495e',
                          },
                          '& .MuiChip-deleteIcon': {
                            color: 'white',
                            '&:hover': {
                              color: '#e74c3c',
                            },
                          },
                          '&::after': hotel === hotelName ? {
                            content: '"내 호텔"',
                            position: 'absolute',
                            top: '-8px',
                            right: '8px',
                            fontSize: '10px',
                            backgroundColor: '#f39c12',
                            color: 'white',
                            padding: '1px 4px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                          } : {},
                        }}
                      />
                    ))
                ) : (
                  <Typography sx={{ color: '#64748b' }}>선택된 호텔이 없습니다.</Typography>
                )}
              </Box>
            </Box>

            <Box sx={{
              p: 2,
              borderTop: '1px solid rgba(0, 0, 0, 0.05)',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                지도에서 호텔을 클릭하거나 검색하여 경쟁 호텔을 선택하세요
              </span>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                선택된 호텔: {selectedCompetitorHotels.length}/5개
              </span>
            </Box>

            <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{
                  backgroundColor: '#2c3e50',
                  '&:hover': {
                    backgroundColor: '#34495e',
                  },
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                }}
              >
                경쟁 호텔 정보 저장
              </Button>
            </Box>
          </form>
        </Box>
      </div>
    </div>
  );
}
