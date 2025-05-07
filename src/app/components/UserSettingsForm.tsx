"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Box, TextField, Button, Chip, Typography } from "@mui/material";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";

const mapContainerStyle = { width: "100%", height: "500px" };
const defaultCenter = { lat: 37.5665, lng: 126.9780 };
const libraries: ("places")[] = ["places"];

interface CustomMapMouseEvent extends google.maps.MapMouseEvent {
  placeId?: string;
}

// Daum 우편번호 타입 정의 추가
declare global {
  interface Window {
    daum: {
      Postcode: new (options: any) => any;
    };
  }
}

// API 베이스 URL 가져오기
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
};

const UserSettingsForm = () => {
  const router = useRouter();
  const dashboardPath = process.env.NEXT_PUBLIC_DASHBOARD_PATH || "/dashboard";


  // 사용자 정보 상태 (ID, 이메일, provider)
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userProvider, setUserProvider] = useState<string>("");

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [hotelAddress, setHotelAddress] = useState("");
  const [hotelName, setHotelName] = useState(""); // Initialize with empty string
  const [hotelLatitude, setHotelLatitude] = useState<number | null>(null);
  const [hotelLongitude, setHotelLongitude] = useState<number | null>(null);
  // 경쟁호텔 선택 (최대 5개)
  const [selectedCompetitorHotels, setSelectedCompetitorHotels] = useState<string[]>([]);
  const [error, setError] = useState("");

  // 원본 데이터 상태 (변경 여부 비교용)
  const [originalHotelAddress, setOriginalHotelAddress] = useState("");
  const [originalHotelName, setOriginalHotelName] = useState(""); // Initialize with empty string
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
        setUserEmail(session.user.email || "");
        setUserProvider(session.user.app_metadata.provider || "email");
      } else {
        router.push("/auth/login");
      }
    };
    fetchSession();
  }, [router]);

  // 기존 사용자 정보 가져오기 (competitor_hotels, hotel_address, hotel_name)
  // ① 사용자 정보 및 주소정보(user_address_info)·users 테이블 초기 로드
  useEffect(() => {
    const fetchUserData = async () => {
      // 1) 세션에서 user.id 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const uid = user.id;
      setUserId(uid);

      // 2) 주소 후처리 테이블에서 hotel_address·위경도 불러오기
      const { data: addrInfo, error: addrErr } = await supabase
        .from("user_address_info")
        .select("address, latitude, longitude")
        .eq("user_id", uid)
        .single();
      if (!addrErr && addrInfo) {
        setHotelAddress(addrInfo.address);
        setOriginalHotelAddress(addrInfo.address);
        setHotelLatitude(addrInfo.latitude);
        setHotelLongitude(addrInfo.longitude);
      }

      // 3) users 테이블에서 hotel_name·competitor_hotels 불러오기
      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("hotel_name, competitor_hotels")
        .eq("id", uid)
        .single();
      if (!userErr && userData) {
        // Ensure hotelName is set to empty string if null/undefined from DB
        setHotelName(userData.hotel_name || "");
        setOriginalHotelName(userData.hotel_name || "");
        setSelectedCompetitorHotels(userData.competitor_hotels || []);
        setOriginalCompetitorHotels(userData.competitor_hotels || []);
      } else if (userErr) {
        // Handle potential error fetching user data, maybe set defaults
        console.error("Error fetching user details:", userErr);
        setHotelName(""); // Default to empty string on error too
        setOriginalHotelName("");
        setSelectedCompetitorHotels([]);
        setOriginalCompetitorHotels([]);
      }
    };

    fetchUserData();
  }, []); // Keep dependency array as is unless uid changes trigger refetch

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
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
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
                // 타입 안전하게 수정
                setSelectedCompetitorHotels((prev) => {
                  if (place.name) {
                    return [...prev, place.name];
                  }
                  return [...prev];
                });
              }
            }
          }
        }
      );
    }
  };

  const onMapLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  // 폼 제출: 변경된 부분만 업데이트 (분리된 로직)
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(""); // Clear previous errors
    // setLoading(true); // Assuming you have loading state

    let userId = ""; // Initialize userId
    let currentError = ""; // Temporary variable to hold error message

    try {
      // 1. Get current user ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Error fetching user:", userError);
        currentError = "사용자 정보를 가져올 수 없습니다. 다시 로그인해주세요.";
        setError(currentError);
        // setLoading(false);
        return;
      }
      userId = user.id; // Assign userId

      // --- Call FastAPI to get region and location_code ---
      let region = "UNKNOWN";
      let location_code = "UNKNOWN";
      const apiBaseUrl = getApiBaseUrl(); // Get base URL
      const apiUrl = `${apiBaseUrl}/api/onboarding/input-postprocess/address`;

      if (!hotelAddress) {
        currentError = "호텔 주소를 입력해주세요.";
        setError(currentError);
        return;
      }

      try {
        console.log(`Calling FastAPI endpoint: ${apiUrl} with address: ${hotelAddress}`);
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address: hotelAddress }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`FastAPI Error ${response.status}: ${errorText}`);
          currentError = `주소 처리 중 오류 발생 (서버: ${response.status})`;
          setError(currentError);
          return; // Stop execution if API call fails
        }

        const result = await response.json();
        console.log("FastAPI Response:", result);

        // Assuming API returns 'location' for location_code and 'region' for region
        location_code = result.location || "UNKNOWN";
        region = result.region || "UNKNOWN";

        // Optional: Add length check/truncation if needed, though API should ideally handle this
        // const MAX_LENGTH = 6;
        // location_code = location_code.substring(0, MAX_LENGTH);
        // region = region.substring(0, MAX_LENGTH);

      } catch (apiError: any) {
        console.error("Error calling FastAPI:", apiError);
        currentError = `주소 처리 API 호출 중 오류 발생: ${apiError.message || '네트워크 오류'}`;
        setError(currentError);
        return; // Stop execution on API call error
      }

      console.log("Received region from API:", region);
      console.log("Received location_code from API:", location_code);
      // --- End FastAPI call ---


      // --- Operation 1: Upsert Address Info ---
      const addressPayload = {
        user_id: userId,
        address: hotelAddress, // Use the original address submitted by user
        latitude: hotelLatitude,
        longitude: hotelLongitude,
        location_code: location_code, // Use value from API
        region: region, // Use value from API
      };

      console.log("Attempting to upsert address payload:", addressPayload);
      if (!addressPayload.user_id) {
        // This check might be redundant now but kept for safety
        console.error("USER ID IS MISSING for address upsert!");
        currentError = "사용자 ID가 누락되었습니다.";
        setError(currentError);
        // setLoading(false);
        return;
      }
      // Add validation for API-derived region and location_code before upsert
      if (!addressPayload.region || addressPayload.region === "UNKNOWN") {
        console.error("REGION IS MISSING or UNKNOWN after API call!");
        currentError = "주소에서 지역 정보를 가져올 수 없습니다 (API 오류?).";
        setError(currentError);
        // setLoading(false);
        return; // Prevent upsert if region is missing
      }
      if (!addressPayload.location_code || addressPayload.location_code === "UNKNOWN") {
        console.error("LOCATION CODE IS MISSING or UNKNOWN after API call!");
        currentError = "주소에서 위치 코드를 가져올 수 없습니다 (API 오류?).";
        setError(currentError);
        // setLoading(false);
        return; // Prevent upsert if location_code is missing
      }

      const { error: addressUpsertError } = await supabase
        .from('user_address_info')
        .upsert(addressPayload, { onConflict: 'user_id' });

      if (addressUpsertError) {
        // Log the full error object for detailed inspection, force stringify
        let errorString = "알 수 없는 주소 저장 오류";
        try {
          errorString = JSON.stringify(addressUpsertError);
        } catch (e) {
          console.error("Failed to stringify addressUpsertError:", e);
        }
        console.error("Supabase Address Upsert Error Object (Stringified):", errorString);

        // Provide a more informative error message, falling back to stringified object
        currentError = `주소 정보 저장 실패: ${addressUpsertError.message || errorString}`;
        // Check for specific NOT NULL violation if possible (might be in message or code)
        if (addressUpsertError.message?.includes('violates not-null constraint') && addressUpsertError.message?.includes('"region"')) {
          currentError = '주소 정보 저장 실패: 지역(region) 정보가 누락되었습니다.';
        }
        setError(currentError);
        throw addressUpsertError; // Stop further execution
      }
      console.log("Address info saved successfully!");


      // --- Operation 2: Update User Info ---
      const userPayload = {
        // user_id is used in .eq(), not in the payload itself for update
        hotel_name: hotelName,
        competitor_hotels: selectedCompetitorHotels,
        is_initialized: true, // Mark as initialized after saving settings
      };

      console.log("Attempting to update user payload:", userPayload);

      const { error: userUpdateError } = await supabase
        .from('users')
        .update(userPayload)
        .eq('id', userId); // Use user_id to specify which user to update

      if (userUpdateError) {
        // Log the full error object, force stringify
        let errorString = "알 수 없는 사용자 정보 업데이트 오류";
        try {
          errorString = JSON.stringify(userUpdateError);
        } catch (e) {
          console.error("Failed to stringify userUpdateError:", e);
        }
        console.error("Supabase User Update Error Object (Stringified):", errorString);

        // Provide a more informative error message
        currentError = `사용자 정보 업데이트 실패: ${userUpdateError.message || errorString}`;
        setError(currentError);
        // Don't necessarily throw here if address was saved, depends on desired behavior
      } else {
        console.log("User info updated successfully!");
      }


      // --- Post-Save Actions ---
      // Only redirect if no error occurred during user update
      if (!currentError && !userUpdateError) { // Check if currentError is still empty and userUpdate was successful
        console.log("Onboarding complete. Redirecting to dashboard...");
        router.push(dashboardPath);
      }


    } catch (error: any) {
      // Log the full caught error object, force stringify
      let errorString = "알 수 없는 제출 오류";
      try {
        errorString = JSON.stringify(error);
      } catch (e) {
        console.error("Failed to stringify caught error:", e);
      }
      console.error("Form submission caught error object (Stringified):", errorString);

      // Set error state only if it wasn't set by specific checks above
      if (!currentError) { // Check if an error message was already set
        let displayError = "예상치 못한 오류가 발생했습니다.";
        if (error) {
          if (typeof error === 'object' && error !== null) {
            displayError = error.message || errorString; // Use message if available, else stringified
          } else if (typeof error === 'string') {
            displayError = error;
          }
        }
        setError(displayError);
      }
    } finally {
      // setLoading(false);
    }
  };

  if (loadError) return <p>🚨 지도 로드 실패</p>;
  if (!isLoaded) return <p>📍 지도를 불러오는 중...</p>;

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
        }}>회원 초기화 정보 입력</h2>

        {error && (
          <Box sx={{
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            color: '#e74c3c',
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

        <form id="onboardingForm" onSubmit={handleSubmit} className="flex flex-col space-y-4">
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
                호텔 정보
              </h2>
            </Box>

            <Box sx={{ p: 3 }}>
              <Box className="flex items-center gap-2 mb-4">
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
                    height: '56px'
                  }}
                >
                  우편번호 검색
                </Button>
              </Box>

              <TextField
                label="호텔 이름"
                value={hotelName} // This value should now always be a string
                onChange={(e) => setHotelName(e.target.value)}
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
                호텔 주소와 이름을 입력하세요
              </span>
            </Box>
          </Box>

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
                top: 70,
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
                선택된 경쟁 호텔
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {selectedCompetitorHotels.length > 0 ? (
                  selectedCompetitorHotels.map((hotel, index) => (
                    <Chip
                      key={index}
                      label={hotel}
                      onDelete={() =>
                        setSelectedCompetitorHotels((prev) =>
                          prev.filter((item) => item !== hotel)
                        )
                      }
                      sx={{
                        my: 0.5,
                        backgroundColor: '#2c3e50',
                        color: "white",
                        '&:hover': {
                          backgroundColor: '#34495e',
                        },
                        '& .MuiChip-deleteIcon': {
                          color: 'white',
                          '&:hover': {
                            color: '#e74c3c',
                          },
                        },
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
                지도에서 호텔을 클릭하여 경쟁 호텔을 선택하세요
              </span>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                선택된 호텔: {selectedCompetitorHotels.length}/5개
              </span>
            </Box>
          </Box>
        </form>

        <Box sx={{ mt: 4 }}>
          <Button
            type="submit"
            form="onboardingForm"
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              backgroundColor: '#2c3e50',
              '&:hover': {
                backgroundColor: '#34495e',
              },
              borderRadius: '8px',
              padding: '12px',
              fontSize: '1rem',
              fontWeight: 'bold',
              textTransform: 'none',
              boxShadow: '0 4px 6px rgba(44, 62, 80, 0.2)',
            }}
          >
            정보 업데이트
          </Button>
        </Box>
      </div>
    </div>
  );
};

export default UserSettingsForm;
