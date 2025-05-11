// src/app/dashboard/home/TrendsTable.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { format, addDays } from "date-fns";
import {
    ArrowUpRight,
    ArrowUp,
    ArrowDownRight,
    ArrowDown,
    ArrowRight,
} from "phosphor-react";
import { alpha } from "@mui/material/styles";
import HotelIcon from '@mui/icons-material/Hotel';
import FlightIcon from '@mui/icons-material/Flight';

// Define styles directly in the component instead of importing
const scrollableTableContainerStyle = {
    mb: 4,
    overflowX: "scroll",
    minWidth: "100%",
    "&::-webkit-scrollbar": { height: "8px" },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: "#888",
        borderRadius: "4px",
    },
    "&::-webkit-scrollbar-track": {
        backgroundColor: "#f0f0f0",
    },
};

const headerCellStyle = {
    whiteSpace: "nowrap",
    minWidth: "160px",
    fontWeight: "bold",
};

const contentCellStyle = {
    whiteSpace: "nowrap",
    minWidth: "100px",
    textAlign: "center",
};

const getApiBaseUrl = (): string => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const getTrendIcon = (label: string | null) => {
    switch (label) {
        case "약한 상승":
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2e7d32' }}>
                    <ArrowUpRight size={18} weight="bold" />
                    <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 500 }}>약한 상승</Typography>
                </Box>
            );
        case "강한 상승":
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2e7d32' }}>
                    <ArrowUp size={18} weight="fill" />
                    <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 600 }}>강한 상승</Typography>
                </Box>
            );
        case "약한 하락":
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c62828' }}>
                    <ArrowDownRight size={18} weight="bold" />
                    <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 500 }}>약한 하락</Typography>
                </Box>
            );
        case "강한 하락":
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c62828' }}>
                    <ArrowDown size={18} weight="fill" />
                    <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 600 }}>강한 하락</Typography>
                </Box>
            );
        case "변동 미약":
        default:
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#757575' }}>
                    <ArrowRight size={18} />
                    <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 500 }}>변동 미약</Typography>
                </Box>
            );
    }
};

interface Props {
    days: number;
}

export default function TrendsTable({ days }: Props) {
    const [labelsHotel, setLabelsHotel] = useState<Record<string, string>>({});
    const [labelsFlight, setLabelsFlight] = useState<Record<string, string>>({});
    const [dates, setDates] = useState<string[]>([]);

    useEffect(() => {
        const today = new Date();
        const start = format(today, "yyyy-MM-dd");
        const end = format(addDays(today, 29), "yyyy-MM-dd");
        const fullRange = Array.from({ length: 30 }, (_, i) => format(addDays(today, i), "yyyy-MM-dd"));
        const visibleDates = fullRange.slice(0, days);
        setDates(visibleDates);

        const fetchHotelPCA = async () => {
            try {
                const res = await fetch(
                    `${getApiBaseUrl()}/api/competitor-hotels/pca?start_date=${start}&end_date=${end}&return_df_pca=true&return_df_segments=false`
                );
                const result = await res.json();
                const labelMap: Record<string, string> = {};
                result.df_pca?.forEach((item: any) => {
                    const date = item.index?.slice(0, 10);
                    if (date && item.Label) labelMap[date] = item.Label;
                });
                setLabelsHotel(labelMap);
            } catch (e) {
                console.error("호텔 PCA 로드 실패", e);
            }
        };

        const fetchFlightPCA = async () => {
            try {
                const start = format(today, "yyyy-MM-dd");
                const end = format(addDays(today, 29), "yyyy-MM-dd");
                const res = await fetch(`${getApiBaseUrl()}/api/flight/pca?start_date=${start}&end_date=${end}&return_df_pca=true&return_df_segments=false`);
                const result = await res.json();
                const labelMap: Record<string, string> = {};
                result.df_pca?.forEach((item: any) => {
                    const date = item.index?.slice(0, 10);
                    if (date && item.Label) labelMap[date] = item.Label;
                });
                setLabelsFlight(labelMap);
            } catch (e) {
                console.error("항공 PCA 로드 실패", e);
            }
        };

        fetchHotelPCA();
        fetchFlightPCA();
    }, [days]);

    return (
        <Box sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            background: 'white',
            marginTop: 4
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
                <Typography variant="h6" sx={{
                    fontWeight: 600,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                        <HotelIcon sx={{ mr: 0.5 }} />
                        <FlightIcon />
                    </Box>
                    숙박/항공 트렌드 분석
                </Typography>
            </Box>

            <TableContainer sx={{
                ...scrollableTableContainerStyle,
                maxHeight: '400px',
                '&::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha('#2c3e50', 0.2),
                    borderRadius: '4px',
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: alpha('#2c3e50', 0.05),
                }
            }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{
                            background: 'linear-gradient(90deg, #f5f7ff 0%, #e8eaf6 100%)',
                        }}>
                            <TableCell sx={{
                                ...headerCellStyle,
                                fontSize: '0.95rem',
                                color: '#2c3e50',
                                fontWeight: 700,
                                borderBottom: '2px solid #2c3e50',
                                padding: '16px 24px',
                            }}>항목</TableCell>
                            {dates.map((date) => (
                                <TableCell key={date} sx={{
                                    ...contentCellStyle,
                                    fontSize: '0.9rem',
                                    color: '#2c3e50',
                                    fontWeight: 600,
                                    borderBottom: '2px solid #2c3e50',
                                    padding: '16px 24px',
                                    textAlign: 'center',
                                }}>
                                    {date.slice(5)}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow sx={{
                            '&:hover': {
                                backgroundColor: alpha('#2c3e50', 0.04),
                                transition: 'background-color 0.2s ease'
                            }
                        }}>
                            <TableCell sx={{
                                ...headerCellStyle,
                                padding: '14px 24px',
                                borderLeft: '4px solid #2c3e50',
                                backgroundColor: alpha('#2c3e50', 0.03),
                            }}>Hotel Trend</TableCell>
                            {dates.map((date) => (
                                <TableCell key={date} sx={{
                                    ...contentCellStyle,
                                    padding: '14px 24px',
                                    textAlign: 'center',
                                }}>{getTrendIcon(labelsHotel[date] || null)}</TableCell>
                            ))}
                        </TableRow>
                        <TableRow sx={{
                            '&:hover': {
                                backgroundColor: alpha('#2c3e50', 0.04),
                                transition: 'background-color 0.2s ease'
                            }
                        }}>
                            <TableCell sx={{
                                ...headerCellStyle,
                                padding: '14px 24px',
                                borderLeft: '4px solid #2c3e50',
                                backgroundColor: alpha('#2c3e50', 0.03),
                            }}>Flight Trend</TableCell>
                            {dates.map((date) => (
                                <TableCell key={date} sx={{
                                    ...contentCellStyle,
                                    padding: '14px 24px',
                                    textAlign: 'center',
                                }}>{getTrendIcon(labelsFlight[date] || null)}</TableCell>
                            ))}
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{
                p: 2,
                borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                textAlign: 'right',
                color: '#757575',
                fontSize: '0.8rem'
            }}>
                마지막 업데이트: {new Date().toLocaleString('ko-KR')}
            </Box>
        </Box>
    );
}
