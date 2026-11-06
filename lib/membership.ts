// 여행자 멤버십 등급. 기준(여행 완료 횟수)과 혜택은 여기만 수정하면 됩니다.
import { prisma } from "@/lib/prisma";

export const MEMBERSHIP_TIERS = [
  { key: "BRONZE", name: "브론즈", minTrips: 0, reviewMultiplier: 1 },
  { key: "SILVER", name: "실버", minTrips: 3, reviewMultiplier: 1.2 },
  { key: "GOLD", name: "골드", minTrips: 5, reviewMultiplier: 1.5 },
] as const;

export type MembershipTier = (typeof MEMBERSHIP_TIERS)[number];

// 완료된 여행 횟수로 등급을 정합니다.
export function tierForTrips(completedTrips: number): MembershipTier {
  let current: MembershipTier = MEMBERSHIP_TIERS[0];
  for (const t of MEMBERSHIP_TIERS) {
    if (completedTrips >= t.minTrips) current = t;
  }
  return current;
}

// 다음 등급까지 남은 여행 횟수 (최고 등급이면 null)
export function nextTierInfo(completedTrips: number): { next: MembershipTier; remaining: number } | null {
  const next = MEMBERSHIP_TIERS.find((t) => t.minTrips > completedTrips);
  if (!next) return null;
  return { next, remaining: next.minTrips - completedTrips };
}

export async function completedTripCount(userId: string, tx: Pick<typeof prisma, "booking"> = prisma): Promise<number> {
  return tx.booking.count({ where: { travelerId: userId, status: "COMPLETED" } });
}
