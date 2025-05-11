// src/lib/tableStyles.ts
export const scrollableTableContainerStyle = {
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

export const headerCellStyle = {
    whiteSpace: "nowrap",
    minWidth: "160px",
    fontWeight: "bold",
};

export const contentCellStyle = {
    whiteSpace: "nowrap",
    minWidth: "100px",
    textAlign: "center",
};