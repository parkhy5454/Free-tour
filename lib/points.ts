// 포인트 규칙. 금액을 바꾸려면 여기만 수정하면 됩니다.
export const POINT_RULES = {
  REVIEW_REWARD: 500, // 후기 작성 시 적립 (예약당 1회)
  // 포인트 사용: 1P = 1원, 원화(KRW) 픽업 요금에서만 사용 가능
  PICKUP_USE_CURRENCY: "KRW",
} as const;

export const POINT_REASON_LABEL: Record<string, string> = {
  REVIEW_REWARD: "후기 작성 적립",
  PICKUP_PAYMENT: "공항 픽업 요금 사용",
  PICKUP_REFUND: "공항 픽업 취소 환급",
};
