// 예약 취소 규정. 기간과 비율을 바꾸려면 여기만 수정하세요.
// 여행 시작일까지 남은 일수 기준 (날짜 단위, 현지 기준이 아닌 UTC 날짜 기준)
export const CANCEL_POLICY = [
  { minDaysBefore: 7, rate: 1 }, // 7일 이상 전: 전액
  { minDaysBefore: 3, rate: 0.5 }, // 3~6일 전: 50%
  { minDaysBefore: 0, rate: 0 }, // 2일 이내 또는 당일: 환불 없음
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(startDate: Date, now: Date): number {
  const start = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((start - today) / DAY_MS);
}

// 취소 주체와 날짜에 따른 환불 비율
export function refundRate(startDate: Date, cancelledBy: "TRAVELER" | "GUIDE" | "ADMIN", now: Date = new Date()): number {
  if (cancelledBy === "GUIDE" || cancelledBy === "ADMIN") return 1;
  const days = daysUntil(startDate, now);
  const tier = CANCEL_POLICY.find((t) => days >= t.minDaysBefore);
  return tier ? tier.rate : 0;
}

export function refundAmountFor(amount: number, startDate: Date, cancelledBy: "TRAVELER" | "GUIDE" | "ADMIN", now?: Date): number {
  return Math.round(amount * refundRate(startDate, cancelledBy, now));
}
