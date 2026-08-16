"use client";

import Link from "next/link";
import type { TaxAccountantRow } from "@/lib/tax-accountants";
import { surnameAvatarBgClass } from "@/lib/avatar-surname-color";
import { taxAccountantProfilePath } from "@/lib/seo/urls";
import { TrackedPhoneLink } from "@/components/TrackedPhoneLink";

function telHref(phone: string | null) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits ? `tel:${digits}` : undefined;
}

function avatarLetter(accountant: TaxAccountantRow): string {
  const name = surnameForAvatar(accountant);
  const ch = name.replace(/\s/g, "")[0];
  return ch ?? "?";
}

function surnameForAvatar(accountant: TaxAccountantRow): string {
  const rep = accountant.representative_name?.trim();
  if (rep) return rep;
  return accountant.office_name;
}

function specialtyTone(specialty: string): string {
  if (specialty.includes("증여세") || specialty.includes("상속세")) {
    return "bg-[#FFFBEb] text-warning-content";
  }
  if (specialty.includes("양도세")) {
    return "bg-brand-accent text-brand-dark";
  }
  if (specialty.includes("법인세") || specialty.includes("법인설립")) {
    return "bg-positive-pale text-positive-deep";
  }
  return "bg-surface-muted text-ink-muted";
}

function displayTier(accountant: TaxAccountantRow): "premium" | "standard" | "free" {
  const t = (accountant.tier ?? "").toLowerCase();
  if (t === "premium") return "premium";
  if (t === "standard") return "standard";
  if (accountant.is_premium) return "premium";
  return "free";
}

export function AccountantCard({ accountant }: { accountant: TaxAccountantRow }) {
  const href = telHref(accountant.phone);
  const tier = displayTier(accountant);
  const avatarBg = surnameAvatarBgClass(surnameForAvatar(accountant));

  const borderClass =
    tier === "premium"
      ? "border-2 border-warning shadow-card"
      : tier === "standard"
        ? "border-2 border-primary shadow-card"
        : "border border-line";

  return (
    <article className={`w-full max-w-full overflow-hidden rounded-[14px] bg-white ${borderClass}`}>
      {tier === "premium" ? (
        <div className="bg-amber-100 px-4 py-1.5 text-center text-xs font-bold text-amber-900">
          👑 추천
        </div>
      ) : tier === "standard" ? (
        <div className="bg-brand-accent px-4 py-1.5 text-center text-xs font-bold text-brand-dark">
          ⭐ 우수
        </div>
      ) : null}

      <div className="p-4 sm:p-5">
        <div className="flex gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-md ring-2 ring-black/5 ${avatarBg}`}
            aria-hidden
          >
            {avatarLetter(accountant)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-base font-bold text-ink">{accountant.office_name}</h3>
              <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${accountant.verification_status === "findtax_verified" ? "bg-positive-pale text-positive-deep" : "bg-surface-muted text-ink-muted"}`}>
                {accountant.verification_status === "findtax_verified" ? "FindTax 서류 확인" : "공개 정보 기반"}
              </span>
            </div>
            {accountant.representative_name ? (
              <p className="mt-0.5 text-xs font-medium text-ink-muted">
                대표 {accountant.representative_name}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-ink-muted">
              {accountant.sido} {accountant.sigungu}
            </p>
            {accountant.specialties?.length ? (
              <ul className="mt-2 flex flex-wrap gap-1">
                {accountant.specialties.map((s) => (
                  <li key={s}>
                    <span
                      className={`inline-block rounded-md px-2 py-1 text-[11px] font-medium ${specialtyTone(
                        s,
                      )}`}
                    >
                      {s}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {accountant.bio ? (
          <p className="mt-3 line-clamp-3 text-sm font-normal text-ink-muted">{accountant.bio}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0 max-w-full flex-1 sm:max-w-[calc(100%-3.5rem)]">
            {href ? (
              <TrackedPhoneLink
                href={href}
                accountantId={accountant.id}
                officeName={accountant.office_name}
                sido={accountant.sido}
                sigungu={accountant.sigungu}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-3 text-center text-sm font-bold text-white transition-colors hover:bg-primary-hover"
              >
                전화로 문의하기
              </TrackedPhoneLink>
            ) : (
              <span className="block rounded-lg border border-dashed border-line py-3 text-center text-xs text-ink-soft">
                등록된 전화번호 없음
              </span>
            )}
          </div>
          <Link
            href={taxAccountantProfilePath(accountant.id)}
            className="shrink-0 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-lg leading-none shadow-sm transition-colors hover:border-brand hover:bg-brand-light/40"
            aria-label="상세보기"
            title="상세보기"
          >
            🔍
          </Link>
        </div>

        <p className="mt-3 text-[11px] text-ink-soft">
          {accountant.verification_status === "findtax_verified"
            ? "FindTax가 파트너 등록 서류를 확인했습니다. 실제 상담 조건은 사무소와 확인하세요."
            : "공개된 사무소 정보를 바탕으로 제공하며 FindTax의 별도 자격 인증을 뜻하지 않습니다."}
        </p>
      </div>
    </article>
  );
}
