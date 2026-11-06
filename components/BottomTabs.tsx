"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, CalendarCheck, User } from "lucide-react";

const TABS = [
  { href: "/", label: "홈", Icon: Home },
  { href: "/guides", label: "가이드", Icon: Compass },
  { href: "/requests/new", label: "여행 요청", Icon: PlusCircle },
  { href: "/bookings", label: "예약", Icon: CalendarCheck },
  { href: "/profile", label: "내 정보", Icon: User },
];

export default function BottomTabs() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="bottom-tabs" aria-label="하단 메뉴">
      {TABS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={isActive(href) ? "active" : undefined}
          aria-current={isActive(href) ? "page" : undefined}
        >
          <Icon size={22} strokeWidth={1.9} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
