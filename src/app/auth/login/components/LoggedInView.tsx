import { Box, Paper, Typography, Button } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import PersonIcon from "@mui/icons-material/Person";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

interface UserInfo {
    id: string;
    email: string | undefined;
    is_subscribed: boolean;  // auth.users 테이블의 is_subscribed 필드
    subscription_end_date: string | null;  // auth.users 테이블의 subscription_end_date 필드
}

interface LoggedInViewProps {
    userInfo: UserInfo;
    authPath: string;
    handleGoDashboard: () => void;
    handleLogout: () => void;
}

export const LoggedInView = ({ userInfo, authPath, handleGoDashboard, handleLogout }: LoggedInViewProps) => {
    // 구독 상태 확인
    const now = new Date();
    const subscriptionEndDate = userInfo.subscription_end_date
        ? new Date(userInfo.subscription_end_date)
        : null;

    // 구독 활성 상태 체크
    const isSubscribed = Boolean(userInfo.is_subscribed) &&
        Boolean(subscriptionEndDate && subscriptionEndDate > now);

    // 구독 만료까지 남은 일수 계산 (7일 이내일 때 연장 버튼 표시)
    const daysUntilExpiration = (subscriptionEndDate && subscriptionEndDate > now)
        ? Math.ceil((subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    // Format the subscription end date
    const formattedEndDate = subscriptionEndDate
        ? subscriptionEndDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : null;

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'white',
            padding: '24px'
        }}>
            <Paper elevation={10} sx={{
                width: '100%',
                maxWidth: '450px',
                borderRadius: '16px',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
                background: 'rgba(255, 255, 255, 0.9)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}>
                <Box sx={{
                    p: 3,
                    background: 'linear-gradient(90deg, #2c3e50, #4a6572)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'url("/pattern.png")',
                        opacity: 0.1,
                        zIndex: 0
                    }
                }}>
                    <Image
                        src="/intelligentlon.png"
                        alt="Company Logo"
                        width={200}
                        height={70}
                        style={{ objectFit: 'contain', marginBottom: '16px', position: 'relative', zIndex: 1 }}
                    />
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)', position: 'relative', zIndex: 1 }}>
                        로그인 상태
                    </Typography>
                </Box>

                <Box sx={{ p: 4 }}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 4,
                        p: 2,
                        backgroundColor: 'rgba(44, 62, 80, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(44, 62, 80, 0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            transform: 'translateY(-2px)'
                        }
                    }}>
                        <PersonIcon sx={{ color: '#2c3e50', mr: 2, fontSize: 28 }} />
                        <Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 'bold' }}>
                                로그인 계정
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#2c3e50', fontSize: '1.1rem' }}>
                                {userInfo.email}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Subscription Status */}
                    <Box sx={{
                        mb: 4,
                        p: 2,
                        backgroundColor: isSubscribed ? 'rgba(46, 204, 113, 0.05)' : 'rgba(231, 76, 60, 0.05)',
                        borderRadius: '12px',
                        border: `1px solid ${isSubscribed ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'}`,
                    }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 'bold' }}>
                            구독 상태
                        </Typography>
                        <Typography variant="body1" sx={{
                            fontWeight: 'medium',
                            color: isSubscribed ? '#27ae60' : '#e74c3c',
                            fontSize: '1.1rem'
                        }}>
                            {isSubscribed ? (
                                daysUntilExpiration <= 7 ? '구독 만료 임박' : '구독 중'
                            ) : (
                                userInfo.is_subscribed && subscriptionEndDate && subscriptionEndDate <= now
                                    ? '구독 만료됨'
                                    : '구독하지 않음'
                            )}
                        </Typography>
                        {subscriptionEndDate && (
                            <Typography variant="caption" sx={{
                                display: 'block',
                                color: daysUntilExpiration <= 7 ? '#e67e22' : '#64748b',
                                mt: 1,
                                fontWeight: daysUntilExpiration <= 7 ? 'bold' : 'normal'
                            }}>
                                {subscriptionEndDate <= now ? '만료일: ' : '구독 만료일: '}{formattedEndDate}
                            </Typography>
                        )}
                    </Box>

                    {isSubscribed ? (
                        <>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<DashboardIcon />}
                                onClick={handleGoDashboard}
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
                                대시보드 이동
                            </Button>
                            {daysUntilExpiration <= 7 && daysUntilExpiration > 0 && (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    component={Link}
                                    href="/dashboard/payment"
                                    sx={{
                                        mb: 2,
                                        py: 1.5,
                                        borderColor: '#f39c12',
                                        color: '#f39c12',
                                        '&:hover': {
                                            backgroundColor: 'rgba(243, 156, 18, 0.05)',
                                            borderColor: '#d68910',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 8px rgba(243, 156, 18, 0.2)'
                                        },
                                        borderRadius: '12px',
                                        fontWeight: 'medium',
                                        borderWidth: '2px',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    구독 연장하기 ({daysUntilExpiration}일 남음)
                                </Button>
                            )}
                        </>
                    ) : (
                        <Button
                            fullWidth
                            variant="contained"
                            component={Link}
                            href="/subscription"
                            startIcon={<ShoppingCartIcon />}
                            sx={{
                                mb: 2,
                                py: 1.5,
                                background: 'linear-gradient(90deg, #2ecc71, #27ae60)',
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #27ae60, #219a52)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 6px 12px rgba(46, 204, 113, 0.3)'
                                },
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px rgba(46, 204, 113, 0.2)',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            구독하기
                        </Button>
                    )}

                    <Button
                        fullWidth
                        variant="outlined"
                        component={Link}
                        href={`${authPath}/update-password`}
                        sx={{
                            mb: 2,
                            py: 1.5,
                            borderColor: '#3498db',
                            color: '#3498db',
                            '&:hover': {
                                backgroundColor: 'rgba(52, 152, 219, 0.05)',
                                borderColor: '#2980b9',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(52, 152, 219, 0.2)'
                            },
                            borderRadius: '12px',
                            fontWeight: 'medium',
                            borderWidth: '2px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        비밀번호 변경
                    </Button>

                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
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
                        로그아웃
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}