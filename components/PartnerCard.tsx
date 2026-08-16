"use client";

import { BadgeCheck } from "lucide-react";
import type { VerifiedPartner } from "@/lib/partners-directory";
import { surnameAvatarBgClass } from "@/lib/avatar-surname-color";
import { useLeadExperience } from "@/components/lead-experience-context";

function avatarLetter(partner: VerifiedPartner): string {
  const name = partner.representativeName?.trim() || partner.officeName;
  const ch = name.replace(/\s/g, "")[0];
  return ch ?? "?";
}

function specialtyTone(specialty: string): string {
  if (specialty.includes("증여") || specialty.includes("상속")) {
    return "bg-[#fef3c7] text-[#92400e]";
  }
  if (specialty.includes("양도")) {
    return "bg-[#ede9fe] text-[#5b21b6]";
  }
  if (specialty.includes("법인")) {
    return "bg-[#dbeafe] text-[#1e40af]";
  }
  return "bg-[#f1f5f9] text-[#475569]";
}

export function PartnerCard({ partner }: { partner: VerifiedPartner }) {
  const { open } = useLeadExperience();
  const avatarBg = surnameAvatarBgClass(
    partner.representativeName?.trim() || partner.officeName,
  );

  return (
    <article className="w-full max-w-full overflow-hidden rounded-[14px] border-2 border-brand bg-white shadow-sm">
      <div className="flex items-center gap-1.5 bg-brand px-4 py-1.5 text-center text-xs font-bold text-ink">
        <BadgeCheck size={14} />
        FindTax 인증 파트너
        {partner.isFounder ? <span className="ml-1 font-extrabold">· 파운더</span> : null}
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-md ring-2 ring-black/5 ${avatarBg}`}
            aria-hidden
          >
            {avatarLetter(partner)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-[#0f1e3d]">{partner.officeName}</h3>
            {partner.representativeName ? (
              <p className="mt-0.5 text-xs font-medium text-[#6b7280]">
                대표 {partner.representativeName}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-[#6b7280]">
              {partner.sido} {partner.sigungu}
            </p>
            {partner.specialties.length ? (
              <ul className="mt-2 flex flex-wrap gap-1">
                {partner.specialties.map((s) => (
                  <li key={s}>
                    <span
                      className={`inline-block rounded-md px-2 py-1 text-[11px] font-medium ${specialtyTone(s)}`}
                    >
                      {s}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            open({
              sido: partner.sido,
              sigungu: partner.sigungu,
            })
          }
          className="mt-4 w-full rounded-xl bg-brand py-3 text-center text-sm font-bold text-ink transition-colors hover:bg-brand-light"
        >
          무료 상담 신청
        </button>

        <p className="mt-3 text-[11px] text-[#9ca3af]">
          FindTax가 자격을 확인한 인증 파트너입니다. 신청하시면 담당자가 확인 후 연결해 드립니다.
        </p>
      </div>
    </article>
  );
}
