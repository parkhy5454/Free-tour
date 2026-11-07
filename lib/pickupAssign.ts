// 픽업 자동 배정 규칙. 기준을 바꾸려면 여기만 수정하세요.
import type { Prisma } from "@prisma/client";

// 신고가 이 횟수 이상이면 파트너 배정을 자동으로 중단합니다.
export const REPORT_LIMIT = 3;

const ACTIVE_STATUSES = ["ASSIGNED", "IN_PROGRESS"] as const;

// 같은 국가의 활성 파트너 중, 진행 중인 픽업이 가장 적은 업체를 고릅니다.
// 적당한 파트너가 없으면 null을 돌려주고, 픽업은 관리자 배정 대기(REQUESTED)로 남습니다.
export async function pickPartnerId(tx: Prisma.TransactionClient, country: string): Promise<string | null> {
  const partners = await tx.transferPartner.findMany({
    where: { country, isActive: true, reportCount: { lt: REPORT_LIMIT } },
    select: {
      id: true,
      _count: { select: { pickups: { where: { status: { in: [...ACTIVE_STATUSES] } } } } },
    },
  });
  if (partners.length === 0) return null;
  partners.sort((a, b) => a._count.pickups - b._count.pickups);
  return partners[0].id;
}
