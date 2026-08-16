import Link from "next/link";
import { AdminTrafficControl } from "@/components/AdminTrafficControl";

const items = [
  ["상담 운영", "/admin/leads"],
  ["운영 인사이트", "/admin/insights"],
  ["파트너 승인", "/admin/partners"],
  ["문의 관리", "/admin/support"],
] as const;

export function AdminNav({ current }: { current: string }) {
  return (
    <nav aria-label="관리자 메뉴" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
      {items.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold ${current === href ? "border-primary text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}
        >
          {label}
        </Link>
      ))}
      <AdminTrafficControl />
    </nav>
  );
}
