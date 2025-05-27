import React from "react";
import { Box, Typography } from "@mui/material";
import { DataGrid, GridRenderCellParams } from "@mui/x-data-grid";
import FavoriteIcon from "@mui/icons-material/Favorite";

export default function PivotTableDataGrid({
    pivotTableRows,
    pivotTableDates,
    favoriteHotels = [] // 기본값으로 빈 배열
}: {
    pivotTableRows: any[];
    pivotTableDates: string[];
    favoriteHotels?: string[];
}) {
    // 전체 너비 계산: 호텔명 열(150px) + 날짜 열들(각 120px)
    const totalWidth = 150 + pivotTableDates.length * 120;

    return (
        <Box sx={{ mt: 3, overflowX: "auto" }}>
            <Typography variant="h6" gutterBottom>
                피벗 테이블 DataGrid
            </Typography>
            <Box sx={{ width: totalWidth }}>
                <DataGrid
                    autoHeight
                    rows={pivotTableRows}
                    columns={[
                        {
                            field: "hotelName",
                            headerName: "호텔명",
                            width: 150,
                            renderCell: (params: GridRenderCellParams) => {
                                const isStatRow = ['평균 가격', '최고 가격', '최저 가격'].includes(params.value as string);
                                const value = params.value as string;
                                let borderColor = '';

                                if (value === '평균 가격') borderColor = '#2c3e50';
                                else if (value === '최고 가격') borderColor = '#e74c3c';
                                else if (value === '최저 가격') borderColor = '#2ecc71';

                                return (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '100%',
                                        height: '100%',
                                        ...(isStatRow && {
                                            borderLeft: `4px solid ${borderColor}`,
                                            pl: 1,
                                            fontWeight: 'bold',
                                            color: borderColor
                                        })
                                    }}>
                                        {value}
                                        {favoriteHotels.includes(value) && !isStatRow && (
                                            <FavoriteIcon
                                                fontSize="small"
                                                color="error"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </Box>
                                );
                            }
                        },
                        ...pivotTableDates.map((date) => ({
                            field: date,
                            headerName: date,
                            width: 120,
                            renderCell: (params: GridRenderCellParams) => {
                                const rowId = params.row.id;
                                const isStatRow = ['avg', 'max', 'min'].includes(rowId as string);
                                let color = '';

                                if (rowId === 'avg') color = '#2c3e50';
                                else if (rowId === 'max') color = '#e74c3c';
                                else if (rowId === 'min') color = '#2ecc71';

                                return (
                                    <Box sx={{
                                        ...(isStatRow && {
                                            fontWeight: 'bold',
                                            color: color
                                        })
                                    }}>
                                        {params.value !== null ? `₩${params.value.toLocaleString()}` : '-'}
                                    </Box>
                                );
                            }
                        })),
                    ]}
                    hideFooter={true}
                    disableRowSelectionOnClick
                    sx={{
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: 'rgba(44, 62, 80, 0.05)',
                            borderBottom: '2px solid #2c3e50',
                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                            fontWeight: 600,
                            color: '#2c3e50',
                        },
                        '& .MuiDataGrid-cell:focus': {
                            outline: 'none',
                        },
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: 'rgba(44, 62, 80, 0.04)',
                            transition: 'background-color 0.2s ease'
                        },
                        '& .MuiDataGrid-row:nth-of-type(even)': {
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        },
                        '& .MuiDataGrid-footerContainer': {
                            display: 'none',
                        }
                    }}
                />
            </Box>
        </Box>
    );
}
