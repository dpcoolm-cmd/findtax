import Link from "next/link";
import { AuthFooterControls } from "@/components/AuthFooterControls";
import { SiteAdFooter } from "@/components/SiteAdZones";

const FOOTER_LINKS = [
  { href: "/region", label: "지역 세무사 찾기" },
  { href: "/calculator", label: "세금 계산기" },
  { href: "/blog", label: "세금 가이드" },
  { href: "/consult", label: "상담 신청" },
  { href: "/register", label: "전문가 입점" },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto bg-primary text-white">
      <SiteAdFooter />
      <div className="app-shell-frame py-14">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-black text-ink">
                F
              </span>
              <span className="text-xl font-black">FindTax</span>
            </div>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/65">
              복잡한 세금 문제를 먼저 계산하고 비교한 뒤, 필요할 때 지역과 상황에 맞는
              세무사에게 연결하는 세금 의사결정 플랫폼입니다.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm font-semibold text-white/75">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-brand">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-white/15 pt-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="hover:text-white">
              이용약관
            </Link>
            <Link href="/privacy" className="font-semibold text-white/75 hover:text-white">
              개인정보처리방침
            </Link>
            <Link href="/support" className="hover:text-white">
              서비스 문의
            </Link>
          </div>
          <AuthFooterControls />
          <p>© 2026 findtax.kr</p>
        </div>
      </div>
    </footer>
  );
}
