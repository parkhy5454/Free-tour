// 파트너(픽업·이동) 플랫폼 수수료율. 여기만 바꾸면 전체에 반영됩니다. 운영 전 확정 필요.
export const PARTNER_FEE_RATE = 0.15;

// 정가 기준 수수료와 파트너 정산액을 계산합니다.
// 포인트 사용분은 여행자가 덜 내는 금액이므로, 파트너 정산은 정가 기준으로 하고 차액은 플랫폼이 부담합니다.
export function partnerFeeSplit(listPrice: number) {
  const platformFee = Math.round(listPrice * PARTNER_FEE_RATE);
  return { platformFee, partnerPayout: listPrice - platformFee };
}
