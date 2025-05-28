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
    CircularProgress
} from '@mui/material';
import { SubscriptionPlan, PaymentStatus } from './types';

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
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {selectedPlan?.name} 구독
            </DialogTitle>

            <DialogContent>
                {selectedPlan && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            {formatCurrency(selectedPlan.price)}
                        </Typography>

                        <Typography variant="body1" color="text.secondary" gutterBottom>
                            {selectedPlan.description}
                        </Typography>

                        <Typography variant="body2" sx={{ mt: 2 }}>
                            • {selectedPlan.months}개월 이용 가능
                        </Typography>

                        <Typography variant="body2">
                            • AI 호텔 가격 예측 서비스
                        </Typography>

                        <Typography variant="body2">
                            • 실시간 가격 모니터링
                        </Typography>

                        <Typography variant="body2">
                            • 24/7 고객 지원
                        </Typography>
                    </Box>
                )}

                {/* 결제 상태 메시지 */}
                {paymentStatus.status === 'PENDING' && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <CircularProgress size={20} />
                            결제를 처리하고 있습니다...
                        </Box>
                    </Alert>
                )}

                {paymentStatus.status === 'SUCCESS' && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        결제가 성공적으로 완료되었습니다!
                    </Alert>
                )}

                {paymentStatus.status === 'FAILED' && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {paymentStatus.message || '결제에 실패했습니다.'}
                    </Alert>
                )}
            </DialogContent>

            <DialogActions>
                {paymentStatus.status === 'SUCCESS' ? (
                    // 결제 완료 후: 닫기 버튼만 표시
                    <Button onClick={onClose} variant="contained">
                        닫기
                    </Button>
                ) : (
                    // 결제 전 또는 진행 중: 취소와 결제하기 버튼 표시
                    <>
                        <Button onClick={onClose}>
                            취소
                        </Button>

                        <Button
                            variant="contained"
                            onClick={onPayment}
                            disabled={paymentStatus.status === 'PENDING'}
                        >
                            {paymentStatus.status === 'PENDING' ? '처리 중...' : '결제하기'}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default PaymentDialog;
