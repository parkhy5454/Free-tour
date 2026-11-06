// 서비스 지원 국가 목록.
// name 값은 여행 요청(TripRequest.country)과 가이드 프로필(GuideProfile.country)에 그대로 저장되며,
// 가이드 매칭과 픽업 파트너 매칭의 기준이 됩니다.
// pickupPrice(공항 픽업 기본 요금)는 반드시 실제 운영 요금으로 수정하세요.

export type CountryConfig = {
  name: string;
  label: string;
  currency: string;
  timezone: string;
  pickupPrice: number;
};

export const COUNTRIES: CountryConfig[] = [
  { name: "South Korea", label: "대한민국", currency: "KRW", timezone: "Asia/Seoul", pickupPrice: 60000 },
  { name: "Japan", label: "일본", currency: "JPY", timezone: "Asia/Tokyo", pickupPrice: 9000 },
  { name: "Thailand", label: "태국", currency: "THB", timezone: "Asia/Bangkok", pickupPrice: 1500 },
  { name: "Vietnam", label: "베트남", currency: "VND", timezone: "Asia/Ho_Chi_Minh", pickupPrice: 600000 },
];

// zod z.enum에 넘기기 위한 튜플 형태
export const COUNTRY_NAMES = COUNTRIES.map((c) => c.name) as [string, ...string[]];

export function getCountry(name: string): CountryConfig | undefined {
  return COUNTRIES.find((c) => c.name === name);
}

export function countryLabel(name: string): string {
  return getCountry(name)?.label ?? name;
}

// "2026-11-20T14:30" 같은 현지 벽시계 시각을 해당 시간대의 실제 UTC Date로 변환합니다.
export function zonedLocalToUtc(local: string, timeZone: string): Date {
  const asUtc = new Date(`${local}Z`);
  if (Number.isNaN(asUtc.getTime())) return asUtc;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(asUtc);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const wallAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offsetMs = wallAsUtc - asUtc.getTime();
  return new Date(asUtc.getTime() - offsetMs);
}

// 특정 시간대 기준으로 날짜/시간을 표시합니다.
export function formatInZone(date: Date, timeZone: string): string {
  return date.toLocaleString("ko-KR", { timeZone, dateStyle: "short", timeStyle: "short" });
}
