import { Box, Tabs, Tab } from '@mui/material';

interface Video {
    id: string;
    title: string;
}

interface VideoSectionProps {
    videoTab: number;
    handleVideoTabChange: (event: React.SyntheticEvent, newValue: number) => void;
    videos: Video[];
}

export const VideoSection = ({ videoTab, handleVideoTabChange, videos }: VideoSectionProps) => {
    return (
        <>
            <Box sx={{
                width: '100%',
                height: '550px',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 15px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                transform: 'translateZ(0)',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-5px) translateZ(0)',
                    boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.3)'
                },
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.2) 100%)',
                    zIndex: 1,
                    pointerEvents: 'none'
                }
            }}>
                <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videos[videoTab].id}?autoplay=1&mute=1&loop=1&playlist=${videos[videoTab].id}`}
                    title={videos[videoTab].title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'relative', zIndex: 0 }}
                ></iframe>
            </Box>

            <Tabs
                value={videoTab}
                onChange={handleVideoTabChange}
                variant="fullWidth"
                sx={{
                    mt: 2,
                    width: '100%',
                    '& .MuiTabs-indicator': {
                        backgroundColor: '#2c3e50',
                        height: 3
                    }
                }}
            >
                <Tab
                    label="Intelligent L.O.N"
                    sx={{
                        fontWeight: 'bold',
                        color: '#64748b',
                        '&.Mui-selected': { color: '#2c3e50' },
                        transition: 'all 0.3s ease'
                    }}
                />
                <Tab
                    label="WEB Guide"
                    sx={{
                        fontWeight: 'bold',
                        color: '#64748b',
                        '&.Mui-selected': { color: '#2c3e50' },
                        transition: 'all 0.3s ease'
                    }}
                />
                <Tab
                    label="How to use data"
                    sx={{
                        fontWeight: 'bold',
                        color: '#64748b',
                        '&.Mui-selected': { color: '#2c3e50' },
                        transition: 'all 0.3s ease'
                    }}
                />
            </Tabs>
        </>
    );
};