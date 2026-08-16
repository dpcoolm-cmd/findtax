"use client";

import Link from "next/link";
import { ArrowUpRight, Calculator, ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PartnerRegistrationButton } from "@/components/PartnerRegistrationButton";
import { CALCULATOR_DIRECTORY } from "@/lib/seo/calculators";
import { trackSiteEvent } from "@/lib/site-track";

const NAV_LINKS = [
  { href: "/region", label: "세무사 찾기" },
  { href: "/situation", label: "상황별 안내" },
  { href: "/blog", label: "세금 가이드" },
  { href: "/consult", label: "상담 신청" },
] as const;

function NavLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const base = href.split("#")[0] || "/";
  const active = base !== "/" && (pathname === base || pathname.startsWith(`${base}/`));

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-bg-muted text-ink" : "text-ink-muted hover:bg-bg-muted hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const calculatorCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const calculatorActive = pathname === "/calculator" || pathname.startsWith("/calculator/");

  const openCalculatorMenu = () => {
    if (calculatorCloseTimer.current) {
      clearTimeout(calculatorCloseTimer.current);
      calculatorCloseTimer.current = null;
    }
    setCalculatorOpen(true);
  };

  const scheduleCalculatorMenuClose = () => {
    if (calculatorCloseTimer.current) clearTimeout(calculatorCloseTimer.current);
    calculatorCloseTimer.current = setTimeout(() => {
      setCalculatorOpen(false);
      calculatorCloseTimer.current = null;
    }, 220);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  useEffect(() => {
    return () => {
      if (calculatorCloseTimer.current) clearTimeout(calculatorCloseTimer.current);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b transition-all duration-200 ${
        scrolled ? "border-line bg-white shadow-[0_2px_10px_rgba(14,15,12,0.06)]" : "border-line bg-white"
      }`}
    >
      <div className="flex h-8 items-center justify-center bg-primary px-3 text-center">
        <a
          href="https://home-atoz.kr/?utm_source=findtax&utm_medium=referral&utm_campaign=service_crosslink&utm_content=top_banner"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackSiteEvent("cross_service_click", {
              destination: "home-atoz",
              placement: "top_banner",
              path: window.location.pathname,
            })
          }
          className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
        >
          <span className="sm:hidden">집 계약·이사 준비 → home-atoz.kr</span>
          <span className="hidden sm:inline">집 계약부터 대출·법무·이사까지 → home-atoz.kr</span>
          <ArrowUpRight size={13} aria-hidden />
        </a>
      </div>
      <div className="app-shell-frame flex h-[72px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="FindTax 홈">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-black text-brand">
            F
          </span>
          <span className="text-xl font-black text-ink">FindTax</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="주요 메뉴">
          <div
            className="relative"
            onMouseEnter={openCalculatorMenu}
            onMouseLeave={scheduleCalculatorMenuClose}
            onFocus={openCalculatorMenu}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                scheduleCalculatorMenuClose();
              }
            }}
          >
            <button
              type="button"
              className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                calculatorActive ? "bg-bg-muted text-ink" : "text-ink-muted hover:bg-bg-muted hover:text-ink"
              }`}
              aria-expanded={calculatorOpen}
              onClick={openCalculatorMenu}
            >
              세금 계산기
              <ChevronDown size={15} className={calculatorOpen ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>

            {calculatorOpen ? (
              <div className="absolute left-1/2 top-full z-50 w-[720px] -translate-x-1/2 pt-3">
              <div className="rounded-lg border border-line bg-white p-4 shadow-card">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <Link
                    href="/calculator"
                    className="inline-flex items-center gap-2 text-sm font-black text-ink hover:text-brand-dark"
                    onClick={() => setCalculatorOpen(false)}
                  >
                    <Calculator size={18} />
                    전체 계산기 보기
                  </Link>
                  <span className="text-xs font-semibold text-ink-soft">추천 항목 우선 정렬</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {CALCULATOR_DIRECTORY.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setCalculatorOpen(false)}
                      className={`rounded-2xl p-3 transition-colors ${
                        item.featured ? "bg-brand text-ink hover:bg-brand-light" : "hover:bg-bg-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold">{item.shortTitle}</span>
                        <span className={`text-[11px] font-bold ${item.featured ? "text-ink/65" : "text-ink-soft"}`}>
                          {item.featured ? "추천" : item.category}
                        </span>
                      </div>
                      <p className={`mt-1 line-clamp-2 text-xs leading-5 ${item.featured ? "text-ink/70" : "text-ink-muted"}`}>
                        {item.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
              </div>
            ) : null}
          </div>
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="hidden lg:block">
          <PartnerRegistrationButton
            label="전문가 입점"
            className="btn-accent min-h-11 px-5 text-sm"
          />
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-white text-ink lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 top-[105px] z-50 bg-white lg:hidden" id="mobile-nav">
          <nav className="app-shell-frame flex h-full flex-col py-6" aria-label="모바일 메뉴">
            <div className="flex flex-col gap-1">
              <Link
                href="/calculator"
                onClick={() => setMenuOpen(false)}
                className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                  calculatorActive ? "bg-bg-muted text-ink" : "text-ink-muted hover:bg-bg-muted hover:text-ink"
                }`}
              >
                세금 계산기
              </Link>
              <div className="grid grid-cols-2 gap-2 pb-3 pl-3 pt-1">
                {CALCULATOR_DIRECTORY.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-2xl px-3 py-2 text-sm font-semibold ${
                      item.featured ? "bg-brand text-ink" : "bg-bg-muted text-ink-muted"
                    }`}
                  >
                    {item.shortTitle}
                  </Link>
                ))}
              </div>
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.href}
                  {...link}
                  onNavigate={() => setMenuOpen(false)}
                />
              ))}
            </div>
            <div className="mt-auto pb-8">
              <PartnerRegistrationButton
                label="전문가 입점"
                onNavigate={() => setMenuOpen(false)}
                className="flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-5 text-base font-semibold text-white"
              />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
