// 여행 중 이동(호텔 간 이동) 요금. 국가별 고정 요금이며, 금액은 여기만 수정하면 됩니다.
// 아래 금액은 임시 값이니 실제 운영 요금으로 바꿔 주세요.
export const TRANSFER_PRICE: Record<string, { price: number; currency: string }> = {
  "South Korea": { price: 30000, currency: "KRW" },
  Japan: { price: 4000, currency: "JPY" },
  Thailand: { price: 800, currency: "THB" },
  Vietnam: { price: 300000, currency: "VND" },
};

export function transferPriceFor(country: string) {
  return TRANSFER_PRICE[country] ?? null;
}
