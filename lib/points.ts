// 포인트 규칙. 금액이나 환율을 바꾸려면 여기만 수정하면 됩니다.
// 포인트의 기준 단위: 1P = 1원(KRW). 전 세계 어디서 적립한 포인트든 같은 가치입니다.
export const POINT_RULES = {
  REVIEW_REWARD: 500, // 후기 작성 시 적립 (예약당 1회)
} as const;

// 고정 환율표: 1개 현지 통화 = 몇 원(KRW)인지. 실제 환율과 차이가 나면 여기 숫자를 조정하세요.
export const KRW_PER_UNIT: Record<string, number> = {
  KRW: 1,
  JPY: 9.5,
  THB: 40,
  VND: 0.058,
};

// 현지 통화 금액을 원화 가치로 환산 (포인트 사용 한도 계산에 사용)
export function priceInKrw(price: number, currency: string): number | null {
  const rate = KRW_PER_UNIT[currency];
  if (!rate) return null;
  return Math.round(price * rate);
}

// 사용한 포인트(원 단위)만큼 현지 통화 결제 금액에서 차감되는 금액 (올림)
export function pointsToLocal(points: number, currency: string): number {
  const rate = KRW_PER_UNIT[currency];
  if (!rate) return 0;
  return Math.ceil(points / rate);
}

export const POINT_REASON_LABEL: Record<string, string> = {
  REVIEW_REWARD: "후기 작성 적립",
  PICKUP_PAYMENT: "공항 픽업 요금 사용",
  PICKUP_REFUND: "공항 픽업 취소 환급",
};
