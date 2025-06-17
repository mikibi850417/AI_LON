import React from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Alert,
    CircularProgress,
    Divider,
    Chip,
    Grid
} from '@mui/material';
import { SubscriptionPlan, PaymentStatus } from './types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaymentIcon from '@mui/icons-material/Payment';
import SecurityIcon from '@mui/icons-material/Security';
import StarIcon from '@mui/icons-material/Star';

interface PaymentDialogProps {
    open: boolean;
    selectedPlan: SubscriptionPlan | null;
    paymentStatus: PaymentStatus;
    onClose: () => void;
    onPayment: () => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
    open,
    selectedPlan,
    paymentStatus,
    onClose,
    onPayment
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(44, 62, 80, 0.1)',
                    position: 'relative'
                }
            }}
        >
            {/* 헤더 섹션 */}
            <Box sx={{
                background: 'linear-gradient(90deg, #2c3e50, #4a6572)',
                color: 'white',
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
                <DialogTitle sx={{ 
                    textAlign: 'center',
                    py: 4,
                    position: 'relative',
                    zIndex: 1
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <StarIcon sx={{ mr: 1, color: '#ffd700' }} />
                        <Typography variant="h5" sx={{ 
                            fontWeight: 'bold',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                            {selectedPlan?.name}
                        </Typography>
                    </Box>
                </DialogTitle>
            </Box>

            <DialogContent sx={{ p: 0 }}>
                {selectedPlan && (
                    <Box sx={{ p: 4 }}>
                        {/* 가격 섹션 */}
                        <Box sx={{ 
                            textAlign: 'center', 
                            mb: 4,
                            p: 3,
                            background: 'linear-gradient(135deg, rgba(44, 62, 80, 0.05), rgba(74, 101, 114, 0.05))',
                            borderRadius: '12px',
                            border: '1px solid rgba(44, 62, 80, 0.1)'
                        }}>
                            <Typography variant="h3" sx={{ 
                                fontWeight: 'bold',
                                color: '#2c3e50',
                                mb: 1
                            }}>
                                {formatCurrency(selectedPlan.price)}
                            </Typography>
                            <Chip 
                                label={`${selectedPlan.months}개월 이용`}
                                sx={{
                                    background: 'linear-gradient(45deg, #2c3e50, #4a6572)',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}
                            />
                        </Box>

                        {/* 플랜 설명 */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="body1" sx={{ 
                                color: '#64748b',
                                textAlign: 'center',
                                mb: 3,
                                fontSize: '1.1rem'
                            }}>
                                {selectedPlan.description}
                            </Typography>

                            <Divider sx={{ my: 3 }} />

                            {/* 혜택 목록 */}
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <CheckCircleIcon sx={{ color: '#27ae60', mr: 2 }} />
                                        <Typography variant="body1" sx={{ color: '#2c3e50' }}>
                                            {selectedPlan.months}개월 이용 가능
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <CheckCircleIcon sx={{ color: '#27ae60', mr: 2 }} />
                                        <Typography variant="body1" sx={{ color: '#2c3e50' }}>
                                            AI 호텔 가격 예측 서비스
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <CheckCircleIcon sx={{ color: '#27ae60', mr: 2 }} />
                                        <Typography variant="body1" sx={{ color: '#2c3e50' }}>
                                            실시간 가격 모니터링
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <CheckCircleIcon sx={{ color: '#27ae60', mr: 2 }} />
                                        <Typography variant="body1" sx={{ color: '#2c3e50' }}>
                                            고객 지원
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* 보안 정보 */}
                        <Box sx={{
                            p: 3,
                            background: 'rgba(39, 174, 96, 0.1)',
                            borderRadius: '12px',
                            border: '1px solid rgba(39, 174, 96, 0.2)',
                            mb: 3
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <SecurityIcon sx={{ color: '#27ae60', mr: 1 }} />
                                <Typography variant="subtitle2" sx={{ 
                                    fontWeight: 'bold',
                                    color: '#27ae60'
                                }}>
                                    안전한 결제
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                SSL 암호화로 보호되는 안전한 결제 시스템
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* 결제 상태 메시지 */}
                {paymentStatus.status === 'PENDING' && (
                    <Box sx={{ px: 4, pb: 2 }}>
                        <Alert 
                            severity="info" 
                            sx={{ 
                                borderRadius: '12px',
                                background: 'rgba(44, 62, 80, 0.1)',
                                border: '1px solid rgba(44, 62, 80, 0.2)',
                                '& .MuiAlert-icon': {
                                    color: '#2c3e50'
                                }
                            }}
                        >
                            <Box display="flex" alignItems="center" gap={1}>
                                <CircularProgress size={20} sx={{ color: '#2c3e50' }} />
                                <Typography sx={{ color: '#2c3e50', fontWeight: 'medium' }}>
                                    결제를 처리하고 있습니다...
                                </Typography>
                            </Box>
                        </Alert>
                    </Box>
                )}

                {paymentStatus.status === 'SUCCESS' && (
                    <Box sx={{ px: 4, pb: 2 }}>
                        <Alert 
                            severity="success" 
                            sx={{ 
                                borderRadius: '12px',
                                background: 'rgba(39, 174, 96, 0.1)',
                                border: '1px solid rgba(39, 174, 96, 0.2)'
                            }}
                        >
                            <Typography sx={{ fontWeight: 'medium' }}>
                                🎉 결제가 성공적으로 완료되었습니다!
                            </Typography>
                        </Alert>
                    </Box>
                )}

                {paymentStatus.status === 'FAILED' && (
                    <Box sx={{ px: 4, pb: 2 }}>
                        <Alert 
                            severity="error" 
                            sx={{ 
                                borderRadius: '12px',
                                background: 'rgba(231, 76, 60, 0.1)',
                                border: '1px solid rgba(231, 76, 60, 0.2)'
                            }}
                        >
                            <Typography sx={{ fontWeight: 'medium' }}>
                                {paymentStatus.message || '결제에 실패했습니다.'}
                            </Typography>
                        </Alert>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ 
                p: 4, 
                pt: 2,
                background: 'rgba(248, 249, 250, 0.8)',
                borderTop: '1px solid rgba(44, 62, 80, 0.1)'
            }}>
                {paymentStatus.status === 'SUCCESS' ? (
                    // 결제 완료 후: 닫기 버튼만 표시
                    <Button 
                        onClick={onClose} 
                        variant="contained"
                        fullWidth
                        sx={{
                            py: 1.5,
                            background: 'linear-gradient(90deg, #27ae60, #2ecc71)',
                            '&:hover': {
                                background: 'linear-gradient(90deg, #219a52, #27ae60)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 12px rgba(39, 174, 96, 0.3)'
                            },
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        완료
                    </Button>
                ) : (
                    // 결제 전 또는 진행 중: 취소와 결제하기 버튼 표시
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Button 
                                onClick={onClose}
                                variant="outlined"
                                fullWidth
                                sx={{
                                    py: 1.5,
                                    borderColor: '#64748b',
                                    color: '#64748b',
                                    '&:hover': {
                                        backgroundColor: 'rgba(100, 116, 139, 0.05)',
                                        borderColor: '#475569',
                                        color: '#475569'
                                    },
                                    borderRadius: '12px',
                                    fontWeight: 'medium',
                                    borderWidth: '2px',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                취소
                            </Button>
                        </Grid>
                        <Grid item xs={6}>
                            <Button
                                variant="contained"
                                onClick={onPayment}
                                disabled={paymentStatus.status === 'PENDING'}
                                fullWidth
                                startIcon={paymentStatus.status === 'PENDING' ? 
                                    <CircularProgress size={20} sx={{ color: 'white' }} /> : 
                                    <PaymentIcon />
                                }
                                sx={{
                                    py: 1.5,
                                    background: 'linear-gradient(90deg, #2c3e50, #4a6572)',
                                    '&:hover': {
                                        background: 'linear-gradient(90deg, #1a2a3a, #3a5562)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 12px rgba(44, 62, 80, 0.3)'
                                    },
                                    '&:disabled': {
                                        background: 'rgba(100, 116, 139, 0.6)',
                                        transform: 'none'
                                    },
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {paymentStatus.status === 'PENDING' ? '처리 중...' : '결제하기'}
                            </Button>
                        </Grid>
                    </Grid>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default PaymentDialog;
