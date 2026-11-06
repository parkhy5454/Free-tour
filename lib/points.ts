// 포인트 적립 규칙. 금액을 바꾸려면 여기만 수정하면 됩니다.
export const POINT_RULES = {
  REVIEW_REWARD: 500, // 후기 작성 시 적립 (예약당 1회)
} as const;

export const POINT_REASON_LABEL: Record<string, string> = {
  REVIEW_REWARD: "후기 작성 적립",
};
