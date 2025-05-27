import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Box,
    TextField,
    Button,
    Tabs,
    Tab,
    Typography,
    CircularProgress,
    IconButton,
    Tooltip,
    Chip,
    Autocomplete,
} from "@mui/material";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

// Map settings
const mapContainerStyle = { width: "100%", height: "600px" };
const libraries: ("places")[] = ["places"];

// Custom map event interface with placeId
interface CustomMapMouseEvent extends google.maps.MapMouseEvent {
    placeId?: string;
}

// Date utility functions
const getMinEndDate = (startDate: string) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0];
};

// TabPanel component for hotel tabs
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`hotel-tabpanel-${index}`}
            aria-labelledby={`hotel-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
        </div>
    );
}

export default function HotelSearchAndMap({
    selectedHotels,
    setSelectedHotels,
    favoriteHotels,
    toggleFavorite,
    dateRange,
    setDateRange,
    handleFetchData,
    loading,
    mapCenter,
    setMapCenter,
    loadingFavorites,
}: {
    selectedHotels: string[];
    setSelectedHotels: React.Dispatch<React.SetStateAction<string[]>>;
    favoriteHotels: string[];
    toggleFavorite: (hotelName: string) => Promise<void>;
    dateRange: { start: string; end: string };
    setDateRange: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>;
    handleFetchData: () => Promise<void>;
    loading: boolean;
    mapCenter: { lat: number; lng: number };
    setMapCenter: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }>>;
    loadingFavorites: boolean;
}) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [searchValue, setSearchValue] = useState<string>("");
    const [searchResults, setSearchResults] = useState<
        google.maps.places.AutocompletePrediction[]
    >([]);

    const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

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

    // Tab change handler
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Date change handler
    const handleDateChange = (type: "start" | "end", value: string) => {
        if (type === "start") {
            // When start date changes, set end date to next day automatically
            const nextDay = new Date(value);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split("T")[0];

            setDateRange({
                start: value,
                end: nextDayStr
            });
        } else {
            setDateRange({
                ...dateRange,
                end: value,
            });
        }
    };

    // Search handler for hotel names (within 50km radius of map center)
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchValue(value);
        if (value.length > 2 && autocompleteRef.current) {
            autocompleteRef.current.getPlacePredictions(
                {
                    input: value,
                    types: ["lodging"],
                    location: new google.maps.LatLng(mapCenter.lat, mapCenter.lng),
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
        } else {
            setSearchResults([]);
        }
    };

    // Get hotel details when selected from map
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
                    // Add hotel in a type-safe way
                    const hotelName = place.name;
                    setSelectedHotels((prev) => {
                        if (prev.includes(hotelName)) return prev;
                        return [...prev, hotelName];
                    });

                    setMapCenter({
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                    });
                    map?.panTo(place.geometry.location);
                    map?.setZoom(20);
                }
            }
        );
    };

    // Handle search result selection
    const handleSearchResultSelect = (prediction: google.maps.places.AutocompletePrediction) => {
        if (prediction.place_id) {
            getPlaceDetails(prediction.place_id);
        }
        setSearchValue("");
        setSearchResults([]);
    };

    // Map click handler
    const handleMapClick = (e: CustomMapMouseEvent) => {
        if (e.placeId) {
            getPlaceDetails(e.placeId);
        }
    };

    // Map load handler
    const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
    }, []);

    // Handle removing a hotel
    const handleRemoveHotel = (hotel: string) => {
        setSelectedHotels((prev) => {
            return prev.filter(item => item !== hotel);
        });
    };

    // Select all favorites
    const handleSelectAllFavorites = () => {
        setSelectedHotels((prev) => Array.from(new Set([...prev, ...favoriteHotels])));
    };

    // Reset selection
    const handleResetSelection = () => {
        setSelectedHotels([]);
    };

    // Hotel item rendering with favorite icon
    const renderHotelItem = (
        hotel: string,
        isSelected: boolean,
        fromFavorites = false
    ) => {
        const isFavorite = favoriteHotels.includes(hotel);
        return (
            <Box key={hotel} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Chip
                    label={hotel}
                    variant={isSelected ? "filled" : "outlined"}
                    onClick={() => {
                        if (!isSelected) {
                            setSelectedHotels((prev) => [...prev, hotel]);
                        } else {
                            setSelectedHotels((prev) => prev.filter((item) => item !== hotel));
                        }
                    }}
                    onDelete={
                        !fromFavorites && isSelected
                            ? () => handleRemoveHotel(hotel)
                            : undefined
                    }
                    sx={{
                        my: 0.5,
                        backgroundColor: isSelected ? '#2c3e50' : 'transparent',
                        color: isSelected ? "white" : '#2c3e50',
                        borderColor: '#2c3e50',
                        '&:hover': {
                            backgroundColor: isSelected ? '#34495e' : 'rgba(44, 62, 80, 0.1)',
                        },
                    }}
                />
                <Tooltip title={isFavorite ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}>
                    <IconButton
                        size="small"
                        onClick={() => toggleFavorite(hotel)}
                        color={isFavorite ? "error" : "default"}
                    >
                        {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                </Tooltip>
            </Box>
        );
    };

    if (loadError) return <p>🚨 지도 로드 실패</p>;
    if (!isLoaded) return <p>📍 지도를 불러오는 중...</p>;

    return (
        <Box>
            {/* Search and filter section */}
            <Box sx={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                backgroundColor: 'white'
            }}>
                <Box sx={{ p: 3 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                        }}
                    >
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
                                if (newValue) {
                                    handleSearchResultSelect(newValue);
                                }
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
                            sx={{ minWidth: 300 }}
                        />

                        <TextField
                            label="시작 날짜"
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => handleDateChange("start", e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                        />

                        <TextField
                            label="종료 날짜"
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => handleDateChange("end", e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                min: getMinEndDate(dateRange.start), // 시작 날짜 다음 날부터 선택 가능
                            }}
                            size="small"
                        />

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleFetchData}
                            disabled={selectedHotels.length === 0 || loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            가격 조회
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={handleResetSelection}
                            sx={{
                                borderColor: '#2c3e50',
                                color: '#2c3e50',
                                '&:hover': {
                                    borderColor: '#34495e',
                                    backgroundColor: 'rgba(52, 73, 94, 0.05)',
                                },
                                borderRadius: '8px',
                                padding: '8px 16px'
                            }}
                        >
                            초기화
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* Map and hotel selection area */}
            <Box sx={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                backgroundColor: 'white',
                position: 'relative',
                mt: 3
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
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                        <FavoriteIcon sx={{ mr: 1 }} />
                        호텔 선택
                    </Typography>
                </Box>

                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={15}
                    center={mapCenter}
                    onLoad={onMapLoad}
                    onClick={handleMapClick}
                    clickableIcons={true}
                />

                {/* Hotel list panel overlaying the map */}
                <Box
                    sx={{
                        position: "absolute",
                        top: 70,
                        right: 10,
                        width: "300px",
                        maxHeight: "520px",
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
                    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            aria-label="hotel tabs"
                            variant="fullWidth"
                            sx={{
                                minHeight: "40px",
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#2c3e50',
                                },
                                '& .Mui-selected': {
                                    color: '#2c3e50',
                                    fontWeight: 'bold',
                                },
                            }}
                        >
                            <Tab
                                label="선택된 호텔"
                                id="hotel-tab-0"
                                aria-controls="hotel-tabpanel-0"
                                sx={{ py: 1, minHeight: "40px" }}
                            />
                            <Tab
                                label="즐겨찾기"
                                id="hotel-tab-1"
                                aria-controls="hotel-tabpanel-1"
                                sx={{ py: 1, minHeight: "40px" }}
                            />
                        </Tabs>
                    </Box>

                    <TabPanel value={tabValue} index={0}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {selectedHotels.length > 0 ? (
                                selectedHotels.map((hotel) => renderHotelItem(hotel, true, false))
                            ) : (
                                <Typography>선택된 호텔이 없습니다.</Typography>
                            )}
                        </Box>
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        {loadingFavorites ? (
                            <CircularProgress size={20} sx={{ color: '#2c3e50' }} />
                        ) : favoriteHotels.length > 0 ? (
                            <>
                                <Box sx={{ mb: 2 }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={handleSelectAllFavorites}
                                        sx={{
                                            mr: 1,
                                            borderColor: '#2c3e50',
                                            color: '#2c3e50',
                                            '&:hover': {
                                                borderColor: '#34495e',
                                                backgroundColor: 'rgba(52, 73, 94, 0.05)',
                                            },
                                        }}
                                    >
                                        모두 선택
                                    </Button>
                                </Box>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                    {favoriteHotels.map((hotel) =>
                                        renderHotelItem(hotel, selectedHotels.includes(hotel), true)
                                    )}
                                </Box>
                            </>
                        ) : (
                            <Typography>저장된 즐겨찾기 호텔이 없습니다.</Typography>
                        )}
                    </TabPanel>
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
                        지도에서 호텔을 클릭하거나 검색하여 선택하세요
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        선택된 호텔: {selectedHotels.length}개
                    </span>
                </Box>
            </Box>
        </Box>
    );
}
