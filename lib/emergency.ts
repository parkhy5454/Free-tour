// 국가별 긴급 전화번호. 앱 배포 전에 반드시 공식 자료로 다시 확인하고 수정하세요.
export const EMERGENCY_NUMBERS: Record<string, { police: string; ambulance: string; note?: string }> = {
  "South Korea": { police: "112", ambulance: "119" },
  Japan: { police: "110", ambulance: "119" },
  Thailand: { police: "191", ambulance: "1669" },
  Vietnam: { police: "113", ambulance: "115" },
};
