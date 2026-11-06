"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, CalendarCheck, Settings } from "lucide-react";

// 설정 탭은 /settings, /profile, /admin 하위 페이지에서 모두 활성화됩니다.
const TABS = [
  { href: "/", label: "홈", Icon: Home, matches: ["/"] },
  { href: "/guides", label: "가이드", Icon: Compass, matches: ["/guides"] },
  { href: "/requests/new", label: "여행 요청", Icon: PlusCircle, matches: ["/requests"] },
  { href: "/bookings", label: "예약", Icon: CalendarCheck, matches: ["/bookings"] },
  { href: "/settings", label: "설정", Icon: Settings, matches: ["/settings", "/profile", "/admin"] },
];

export default function BottomTabs() {
  const pathname = usePathname();

  const isActive = (matches: string[]) =>
    matches.some((m) => (m === "/" ? pathname === "/" : pathname.startsWith(m)));

  return (
    <nav className="bottom-tabs" aria-label="하단 메뉴">
      {TABS.map(({ href, label, Icon, matches }) => {
        const active = isActive(matches);
        return (
          <Link
            key={href}
            href={href}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={22} strokeWidth={1.9} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
