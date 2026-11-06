import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { countryLabel, getCountry, formatInZone } from "@/lib/countries";
import PartnerPickupRow from "@/components/PartnerPickupRow";

export const dynamic = "force-dynamic";

// 파트너 센터: 신청 상태 확인 + 배정된 픽업 관리
export default async function PartnerPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const partner = await prisma.transferPartner.findUnique({ where: { userId: session.id } });

  if (!partner) {
    return (
      <main className="page-shell narrow">
        <span className="eyebrow dark">PARTNER CENTER</span>
        <h1>파트너 센터</h1>
        <p className="muted">아직 파트너 신청을 하지 않았습니다.</p>
        <Link href="/partner/join" className="button button-primary" style={{ marginTop: 16 }}>파트너 신청하기</Link>
      </main>
    );
  }

  if (!partner.isActive) {
    return (
      <main className="page-shell narrow">
        <span className="eyebrow dark">PARTNER CENTER</span>
        <h1>{partner.name}</h1>
        <p>승인 대기 중입니다. 관리자가 확인하면 배정 요청을 받을 수 있습니다.</p>
        <p className="muted">운영 국가: {countryLabel(partner.country)}</p>
      </main>
    );
  }

  const pickups = await prisma.pickupRequest.findMany({
    where: { partnerId: partner.id, status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] } },
    orderBy: { arrivalAt: "asc" },
    take: 100,
  });

  const country = getCountry(partner.country);
  const rows = pickups.map((p) => ({
    id: p.id,
    status: p.status,
    airport: p.airport,
    flightNumber: p.flightNumber,
    arrivalLabel: country ? formatInZone(p.arrivalAt, country.timezone) : p.arrivalAt.toISOString(),
    passengers: p.passengers,
    luggageCount: p.luggageCount,
    pickupAddress: p.pickupAddress,
    note: p.note,
    driverName: p.driverName,
    driverPhone: p.driverPhone,
    vehiclePlate: p.vehiclePlate,
  }));

  return (
    <main className="page-shell narrow">
      <span className="eyebrow dark">PARTNER CENTER</span>
      <h1>{partner.name}</h1>
      <p className="muted" style={{ marginBottom: 24 }}>운영 국가: {countryLabel(partner.country)} · 배정된 픽업 {rows.length}건</p>
      {rows.length === 0 ? (
        <p className="muted">배정된 픽업이 아직 없습니다.</p>
      ) : (
        rows.map((r) => <PartnerPickupRow key={r.id} pickup={r} />)
      )}
    </main>
  );
}
