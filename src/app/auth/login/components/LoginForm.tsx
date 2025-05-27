import { Box, TextField, Button, Typography, CircularProgress, Divider } from '@mui/material';
import Link from 'next/link';
import GoogleIcon from "@mui/icons-material/Google";
import LoginIcon from "@mui/icons-material/Login";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";

interface LoginFormProps {
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    error: string;
    loading: boolean;
    handleLogin: () => void;
    handleGoogleLogin: () => void;
    authPath: string;
}

export const LoginForm = ({
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    handleLogin,
    handleGoogleLogin,
    authPath
}: LoginFormProps) => {
    return (
        <Box sx={{ p: 4 }}>
            {error && (
                <Box sx={{
                    p: 2,
                    mb: 3,
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderRadius: '12px',
                    borderLeft: '4px solid #e74c3c',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                        '0%': { boxShadow: '0 0 0 0 rgba(231, 76, 60, 0.4)' },
                        '70%': { boxShadow: '0 0 0 10px rgba(231, 76, 60, 0)' },
                        '100%': { boxShadow: '0 0 0 0 rgba(231, 76, 60, 0)' }
                    }
                }}>
                    <Typography variant="body2" sx={{ color: '#e74c3c' }}>
                        {error}
                    </Typography>
                </Box>
            )}

            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b', fontWeight: 'bold' }}>
                    이메일
                </Typography>
                <TextField
                    fullWidth
                    placeholder="이메일 주소를 입력하세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: '#64748b' }} />,
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            '&:hover fieldset': {
                                borderColor: '#2c3e50',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#2c3e50',
                                borderWidth: '2px'
                            },
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            }
                        }
                    }}
                />
            </Box>

            <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b', fontWeight: 'bold' }}>
                    비밀번호
                </Typography>
                <TextField
                    fullWidth
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                        startAdornment: <LockIcon sx={{ mr: 1, color: '#64748b' }} />,
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            '&:hover fieldset': {
                                borderColor: '#2c3e50',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#2c3e50',
                                borderWidth: '2px'
                            },
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            }
                        }
                    }}
                />
            </Box>

            <Button
                fullWidth
                variant="contained"
                startIcon={<LoginIcon />}
                onClick={handleLogin}
                disabled={loading}
                sx={{
                    mb: 2,
                    py: 1.5,
                    background: 'linear-gradient(90deg, #2c3e50, #4a6572)',
                    '&:hover': {
                        background: 'linear-gradient(90deg, #1a2a3a, #3a5562)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 12px rgba(44, 62, 80, 0.3)'
                    },
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(44, 62, 80, 0.2)',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                }}
            >
                {loading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                    "로그인"
                )}
            </Button>

            <Button
                fullWidth
                variant="contained"
                component={Link}
                href={`${authPath}/signup`}
                sx={{
                    mb: 2,
                    py: 1.5,
                    background: 'linear-gradient(90deg, #27ae60, #2ecc71)',
                    '&:hover': {
                        background: 'linear-gradient(90deg, #219a52, #27ae60)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 12px rgba(39, 174, 96, 0.3)'
                    },
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(39, 174, 96, 0.2)',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    transition: 'all 0.3s ease'
                }}
            >
                회원가입
            </Button>

            <Divider sx={{
                my: 3,
                '&::before, &::after': {
                    borderColor: 'rgba(44, 62, 80, 0.2)'
                }
            }}>
                <Typography variant="body2" sx={{
                    color: '#64748b',
                    px: 1,
                    py: 0.5,
                    borderRadius: '4px',
                    backgroundColor: 'rgba(44, 62, 80, 0.05)'
                }}>
                    또는
                </Typography>
            </Divider>

            <Button
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleLogin}
                sx={{
                    py: 1.5,
                    borderColor: '#e74c3c',
                    color: '#e74c3c',
                    '&:hover': {
                        backgroundColor: 'rgba(231, 76, 60, 0.05)',
                        borderColor: '#c0392b',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(231, 76, 60, 0.2)'
                    },
                    borderRadius: '12px',
                    fontWeight: 'medium',
                    borderWidth: '2px',
                    transition: 'all 0.3s ease'
                }}
            >
                Google 계정으로 로그인
            </Button>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                    비밀번호를 잊으셨나요?{" "}
                    <Typography
                        component="a"
                        href={`${authPath}/reset-password`}
                        variant="body2"
                        sx={{
                            color: '#2c3e50',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            position: 'relative',
                            '&:hover': {
                                color: '#4a6572'
                            },
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                width: '100%',
                                height: '2px',
                                bottom: -2,
                                left: 0,
                                backgroundColor: '#2c3e50',
                                transform: 'scaleX(0)',
                                transformOrigin: 'bottom right',
                                transition: 'transform 0.3s ease'
                            },
                            '&:hover::after': {
                                transform: 'scaleX(1)',
                                transformOrigin: 'bottom left'
                            }
                        }}
                    >
                        비밀번호 초기화
                    </Typography>
                </Typography>
            </Box>
        </Box>
    );
};