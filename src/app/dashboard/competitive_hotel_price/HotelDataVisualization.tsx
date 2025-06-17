import React, { useState } from "react";
import { Box, Tabs, Tab, Checkbox, Typography } from "@mui/material";
import { Bar, Line } from "react-chartjs-2";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TableChartIcon from "@mui/icons-material/TableChart";
import PivotTableDataGrid from "./PivotTableDataGrid";

// Chart colors
const CHART_COLORS = [
    "#3498db", // blue
    "#e67e22", // orange
    "#2ecc71", // green
    "#9b59b6", // purple
    "#e74c3c", // red
    "#1abc9c", // teal
    "#f1c40f", // yellow
    "#34495e", // navy
    "#16a085", // dark teal
    "#d35400", // dark orange
];

// TabPanel component
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
            id={`viz-tabpanel-${index}`}
            aria-labelledby={`viz-tab-${index}`}
            {...other}
        >
            {value === index && <Box>{children}</Box>}
        </div>
    );
}

// FastAPI 스타일 Chart.js 데이터 모델 정의
interface ChartDataset {
    label: string;
    data: (number | null)[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    hoverBackgroundColor?: string;
    siteLabels?: string[];
    borderDash?: number[];
    pointRadius?: number;
    pointBackgroundColor?: string;
    pointBorderColor?: string;
    pointBorderWidth?: number;
    tension?: number;
    fill?: boolean;
}

interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}

interface PivotTableRow {
    hotel_name: string;
    hotelName?: string;
    id?: string;
    [date: string]: string | number | null | undefined;
}

// Add this export to make the props accessible to other components
export type HotelDataVisualizationProps = {
    chartData: ChartData | null;
    lineChartData: ChartData | null;
    pivotTableRows: PivotTableRow[];
    pivotTableDates: string[];
    selectedHotels: string[];
    favoriteHotels: string[];
};

export default function HotelDataVisualization({
    chartData,
    lineChartData,
    pivotTableRows,
    pivotTableDates,
    selectedHotels,
    favoriteHotels,
}: HotelDataVisualizationProps) {
    const [dataDisplayTab, setDataDisplayTab] = useState(0);
    const [showAvgPrice, setShowAvgPrice] = useState(true);
    const [showMaxPrice, setShowMaxPrice] = useState(true);
    const [showMinPrice, setShowMinPrice] = useState(true);

    // Get filtered bar chart data (excluding statistic rows)
    const getFilteredBarChartData = () => {
        if (!chartData) return null;

        return {
            ...chartData,
            datasets: chartData.datasets.filter((dataset: ChartDataset) => {
                // Don't show statistic rows in bar chart
                if (dataset.label === '평균 가격' || dataset.label === '최고 가격' || dataset.label === '최저 가격') {
                    return false;
                }
                return true;
            })
        };
    };

    // Bar chart options
    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    usePointStyle: true,
                    boxWidth: 6,
                    font: {
                        size: 12
                    }
                }
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#2c3e50',
                bodyColor: '#2c3e50',
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                    label: function (tooltipItem: { dataset: { label?: string; siteLabels?: string[] }; dataIndex: number; parsed: { y: number } }) {
                        const label = tooltipItem.dataset.label || "";
                        const value = tooltipItem.parsed.y;
                        if (selectedHotels.length > 1 && tooltipItem.dataset.siteLabels) {
                            const site = tooltipItem.dataset.siteLabels[tooltipItem.dataIndex];
                            return `${label}: ₩${value.toLocaleString()} (Site: ${site})`;
                        }
                        return `${label}: ₩${value.toLocaleString()}`;
                    },
                },
            },
        },
        scales: {
            x: {
                title: { display: true, text: "날짜" },
                grid: {
                    display: false
                },
                ticks: {
                    color: '#64748b'
                }
            },
            y: {
                min: 0,
                title: { display: true, text: "객실 가격 (원)" },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    color: '#64748b',
                    callback: function (value: string | number) {
                        return '₩' + Number(value).toLocaleString();
                    }
                }
            },
        },
    };

    // Line chart options
    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    usePointStyle: true,
                    boxWidth: 6,
                    font: {
                        size: 12
                    },
                    color: '#333'
                }
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#2c3e50',
                bodyColor: '#2c3e50',
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                    label: function (tooltipItem: { dataset: { label?: string }; raw: unknown }) {
                        const label = tooltipItem.dataset.label || "";
                        const value = tooltipItem.raw as number | null;
                        return `${label}: ₩${value?.toLocaleString() || "N/A"}`;
                    },
                },
            },
        },
        scales: {
            x: {
                title: { display: true, text: "날짜", color: '#333' },
                grid: {
                    display: false
                },
                ticks: {
                    color: '#64748b'
                }
            },
            y: {
                min: 0,
                title: { display: true, text: "객실 가격 (원)", color: '#333' },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    color: '#64748b',
                    callback: function (value: string | number) {
                        return '₩' + Number(value).toLocaleString();
                    }
                }
            },
        },
        elements: {
            line: {
                tension: 0.4,
                borderWidth: 2,
            },
            point: {
                radius: 3,
                hoverRadius: 5,
                backgroundColor: 'white',
                borderWidth: 2,
            }
        },
        animation: {
            duration: 1000
        }
    };

    return (
        <Box sx={{ width: '100%', mb: 4 }}>
            <Box sx={{
                borderBottom: 1,
                borderColor: 'divider',
                backgroundColor: 'white',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}>
                <Tabs
                    value={dataDisplayTab}
                    onChange={(e, newValue) => setDataDisplayTab(newValue)}
                    variant="fullWidth"
                    sx={{
                        '& .MuiTab-root': {
                            py: 2,
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                backgroundColor: 'rgba(44, 62, 80, 0.04)',
                            },
                        },
                        '& .Mui-selected': {
                            color: '#2c3e50 !important',
                            fontWeight: 700,
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#2c3e50',
                            height: 3,
                        }
                    }}
                >
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PriceChangeIcon sx={{ mr: 1 }} />
                                호텔별 최저가 비교
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TrendingUpIcon sx={{ mr: 1 }} />
                                날짜별 호텔 가격 추세
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TableChartIcon sx={{ mr: 1 }} />
                                호텔 가격 데이터 테이블
                            </Box>
                        }
                    />
                </Tabs>
            </Box>

            {/* Tab panels */}
            <Box sx={{
                backgroundColor: 'white',
                borderBottomLeftRadius: '16px',
                borderBottomRightRadius: '16px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
            }}>
                {/* Hotel prices by date (Bar chart) */}
                <TabPanel value={dataDisplayTab} index={0}>
                    {chartData && (
                        <Box>
                            <Box sx={{ p: 3, height: '400px' }}>
                                <Bar
                                    data={{
                                        ...getFilteredBarChartData(),
                                        datasets: getFilteredBarChartData()?.datasets.map((dataset: ChartDataset, index: number) => ({
                                            ...dataset,
                                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                                            borderColor: CHART_COLORS[index % CHART_COLORS.length],
                                            borderWidth: 1,
                                            borderRadius: 4,
                                            hoverBackgroundColor: CHART_COLORS[index % CHART_COLORS.length] + 'CC',
                                        })) || []
                                    }}
                                    options={{
                                        ...barChartOptions,
                                        maintainAspectRatio: false,
                                        scales: {
                                            x: {
                                                title: { display: true, text: "날짜" },
                                                grid: { display: false },
                                                ticks: { color: '#64748b' }
                                            },
                                            y: {
                                                min: 0,
                                                title: { display: true, text: "객실 가격 (원)" },
                                                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                                                ticks: {
                                                    color: '#64748b',
                                                    callback: function (value: string | number) {
                                                        return '₩' + Number(value).toLocaleString();
                                                    }
                                                }
                                            }
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
                                    각 호텔의 날짜별 최저가를 비교합니다
                                </span>
                                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                    마지막 업데이트: {new Date().toLocaleString('ko-KR')}
                                </span>
                            </Box>
                        </Box>
                    )}
                </TabPanel>

                {/* Price trends by date (Line chart) */}
                <TabPanel value={dataDisplayTab} index={1}>
                    {lineChartData && (
                        <Box>
                            <Box sx={{ p: 3, height: '400px', position: 'relative' }}>
                                {/* Statistic row display option checkboxes */}
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: 2,
                                    mb: 2,
                                    alignItems: 'center'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Checkbox
                                            checked={showAvgPrice}
                                            onChange={(e) => setShowAvgPrice(e.target.checked)}
                                            sx={{
                                                color: '#2c3e50',
                                                '&.Mui-checked': {
                                                    color: '#2c3e50',
                                                },
                                            }}
                                        />
                                        <Typography variant="body2" sx={{ color: '#2c3e50' }}>평균 가격</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Checkbox
                                            checked={showMaxPrice}
                                            onChange={(e) => setShowMaxPrice(e.target.checked)}
                                            sx={{
                                                color: '#e74c3c',
                                                '&.Mui-checked': {
                                                    color: '#e74c3c',
                                                },
                                            }}
                                        />
                                        <Typography variant="body2" sx={{ color: '#e74c3c' }}>최고 가격</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Checkbox
                                            checked={showMinPrice}
                                            onChange={(e) => setShowMinPrice(e.target.checked)}
                                            sx={{
                                                color: '#2ecc71',
                                                '&.Mui-checked': {
                                                    color: '#2ecc71',
                                                },
                                            }}
                                        />
                                        <Typography variant="body2" sx={{ color: '#2ecc71' }}>최저 가격</Typography>
                                    </Box>
                                </Box>

                                {lineChartData ? (
                                    <Line
                                        data={{
                                            labels: lineChartData.labels,
                                            datasets: lineChartData.datasets
                                                .filter((dataset: ChartDataset) => {
                                                    if (dataset.label === '평균 가격' && !showAvgPrice) return false;
                                                    if (dataset.label === '최고 가격' && !showMaxPrice) return false;
                                                    if (dataset.label === '최저 가격' && !showMinPrice) return false;
                                                    return true;
                                                })
                                                .map((dataset: ChartDataset) => {
                                                    // Special colors for statistic rows
                                                    let color;
                                                    if (dataset.label === '평균 가격') color = '#2c3e50';
                                                    else if (dataset.label === '최고 가격') color = '#e74c3c';
                                                    else if (dataset.label === '최저 가격') color = '#2ecc71';
                                                    else color = `hsl(${(Math.random() * 360).toFixed(0)}, 70%, 50%)`;

                                                    return {
                                                        label: dataset.label,
                                                        data: dataset.data,
                                                        borderColor: color,
                                                        backgroundColor: 'transparent',
                                                        borderWidth: dataset.label.includes('평균') || dataset.label.includes('최고') || dataset.label.includes('최저') ? 2 : 3,
                                                        borderDash: dataset.label.includes('평균') || dataset.label.includes('최고') || dataset.label.includes('최저') ? [5, 5] : [],
                                                        pointRadius: dataset.label.includes('평균') || dataset.label.includes('최고') || dataset.label.includes('최저') ? 0 : 3,
                                                        pointBackgroundColor: 'white',
                                                        pointBorderColor: color,
                                                        pointBorderWidth: 2,
                                                        tension: 0.4,
                                                        fill: false,
                                                    };
                                                })
                                        }}
                                        options={{
                                            ...lineChartOptions,
                                            scales: {
                                                x: {
                                                    title: { display: true, text: "날짜", color: '#333' },
                                                    grid: { display: false },
                                                    ticks: { color: '#64748b' }
                                                },
                                                y: {
                                                    min: 0,
                                                    title: { display: true, text: "객실 가격 (원)", color: '#333' },
                                                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                                                    ticks: {
                                                        color: '#64748b',
                                                        callback: function (value: string | number) {
                                                            return '₩' + Number(value).toLocaleString();
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                ) : (
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: '100%',
                                        color: '#64748b'
                                    }}>
                                        데이터가 없습니다
                                    </Box>
                                )}
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
                                    날짜별 호텔 가격 추세를 확인합니다
                                </span>
                                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                    마지막 업데이트: {new Date().toLocaleString('ko-KR')}
                                </span>
                            </Box>
                        </Box>
                    )}
                </TabPanel>

                {/* Hotel price data table */}
                <TabPanel value={dataDisplayTab} index={2}>
                    {pivotTableRows.length > 0 && pivotTableDates.length > 0 && (
                        <Box>
                            <Box sx={{ p: 3, height: '400px', overflowY: 'auto' }}>
                                <PivotTableDataGrid
                                    pivotTableRows={pivotTableRows}
                                    pivotTableDates={pivotTableDates}
                                    favoriteHotels={favoriteHotels}
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
                                    호텔별 날짜별 가격 데이터를 표로 확인합니다
                                </span>
                                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                    마지막 업데이트: {new Date().toLocaleString('ko-KR')}
                                </span>
                            </Box>
                        </Box>
                    )}
                </TabPanel>
            </Box>
        </Box>
    );
}
