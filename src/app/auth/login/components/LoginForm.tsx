import { Box, TextField, Button, Typography, CircularProgress, Divider } from '@mui/material';
import GoogleIcon from "@mui/icons-material/Google";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";

interface LoginFormProps {
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    confirmPassword: string;
    setConfirmPassword: (confirmPassword: string) => void;
    error: string;
    loading: boolean;
    isSignUp: boolean;
    handleLogin: () => void;
    handleSignUp: () => void;
    handleGoogleAuth: () => void;
    toggleAuthMode: () => void;
    authPath: string;
}

export const LoginForm = ({
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    loading,
    isSignUp,
    handleLogin,
    handleSignUp,
    handleGoogleAuth,
    toggleAuthMode,
    authPath
}: LoginFormProps) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            if (isSignUp) {
                handleSignUp();
            } else {
                handleLogin();
            }
        }
    };

    return (
        <Box sx={{ p: 4 }}>
            {error && (
                <Box sx={{
                    p: 2,
                    mb: 3,
                    backgroundColor: error.includes('완료') ? 'rgba(39, 174, 96, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${error.includes('완료') ? '#27ae60' : '#e74c3c'}`,
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                        '0%': { boxShadow: `0 0 0 0 ${error.includes('완료') ? 'rgba(39, 174, 96, 0.4)' : 'rgba(231, 76, 60, 0.4)'}` },
                        '70%': { boxShadow: `0 0 0 10px ${error.includes('완료') ? 'rgba(39, 174, 96, 0)' : 'rgba(231, 76, 60, 0)'}` },
                        '100%': { boxShadow: `0 0 0 0 ${error.includes('완료') ? 'rgba(39, 174, 96, 0)' : 'rgba(231, 76, 60, 0)'}` }
                    }
                }}>
                    <Typography variant="body2" sx={{ color: error.includes('완료') ? '#27ae60' : '#e74c3c' }}>
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
                    onKeyDown={handleKeyDown}
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

            <Box sx={{ mb: isSignUp ? 3 : 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b', fontWeight: 'bold' }}>
                    비밀번호
                </Typography>
                <TextField
                    fullWidth
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
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

            {isSignUp && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b', fontWeight: 'bold' }}>
                        비밀번호 확인
                    </Typography>
                    <TextField
                        fullWidth
                        type="password"
                        placeholder="비밀번호를 다시 입력하세요"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
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
            )}

            <Button
                fullWidth
                variant="contained"
                startIcon={isSignUp ? <PersonAddIcon /> : <LoginIcon />}
                onClick={isSignUp ? handleSignUp : handleLogin}
                disabled={loading}
                sx={{
                    mb: 2,
                    py: 1.5,
                    background: isSignUp
                        ? 'linear-gradient(90deg, #27ae60, #2ecc71)'
                        : 'linear-gradient(90deg, #2c3e50, #4a6572)',
                    '&:hover': {
                        background: isSignUp
                            ? 'linear-gradient(90deg, #219a52, #27ae60)'
                            : 'linear-gradient(90deg, #1a2a3a, #3a5562)',
                        transform: 'translateY(-2px)',
                        boxShadow: isSignUp
                            ? '0 6px 12px rgba(39, 174, 96, 0.3)'
                            : '0 6px 12px rgba(44, 62, 80, 0.3)'
                    },
                    borderRadius: '12px',
                    boxShadow: isSignUp
                        ? '0 4px 6px rgba(39, 174, 96, 0.2)'
                        : '0 4px 6px rgba(44, 62, 80, 0.2)',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                }}
            >
                {loading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                    isSignUp ? "회원가입" : "로그인"
                )}
            </Button>

            <Button
                fullWidth
                variant="text"
                onClick={toggleAuthMode}
                sx={{
                    mb: 2,
                    py: 1.5,
                    color: '#64748b',
                    '&:hover': {
                        backgroundColor: 'rgba(44, 62, 80, 0.05)',
                        color: '#2c3e50'
                    },
                    borderRadius: '12px',
                    fontWeight: 'medium',
                    transition: 'all 0.3s ease'
                }}
            >
                {isSignUp ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
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
                onClick={handleGoogleAuth}
                disabled={loading}
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
                    '&:disabled': {
                        opacity: 0.6,
                        transform: 'none'
                    },
                    borderRadius: '12px',
                    fontWeight: 'medium',
                    borderWidth: '2px',
                    transition: 'all 0.3s ease'
                }}
            >
                {loading ? (
                    <CircularProgress size={20} sx={{ color: '#e74c3c' }} />
                ) : (
                    `Google 계정으로 ${isSignUp ? "회원가입" : "로그인"}`
                )}
            </Button>

            {!isSignUp && (
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
            )}
        </Box>
    );
};