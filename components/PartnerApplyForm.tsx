"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { FOUNDING_PARTNER_MEMBER_CAP } from "@/config/partner-program";
import {
  normalizeLicenseNumber,
  validateLicenseFormat,
  type PartnerProfessionalType,
} from "@/lib/partner-license";

type FounderStats = { used: number; cap: number };

const DOC_MAX_BYTES = 10 * 1024 * 1024;
const DOC_ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

function validatePartnerDoc(
  file: File | null,
  opts: { required: boolean; label: string },
): { ok: true } | { ok: false; message: string } {
  if (!file) {
    return opts.required
      ? { ok: false, message: `${opts.label} 파일을 선택해 주세요.` }
      : { ok: true };
  }
  if (file.size > DOC_MAX_BYTES) {
    return {
      ok: false,
      message: `${opts.label}: JPG·PNG·PDF만 업로드 가능하며 최대 10MB입니다.`,
    };
  }
  const okType =
    file.type === "application/pdf" ||
    file.type === "image/jpeg" ||
    file.type === "image/png";
  const lower = file.name.toLowerCase();
  const okExt =
    lower.endsWith(".pdf") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png");
  if (!okType && !okExt) {
    return {
      ok: false,
      message: `${opts.label}: JPG, PNG, PDF 형식만 업로드할 수 있습니다.`,
    };
  }
  return { ok: true };
}

export function PartnerApplyForm() {
  const [founder, setFounder] = useState<FounderStats>({
    used: 0,
    cap: FOUNDING_PARTNER_MEMBER_CAP,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  /** 입점은 세무사만 받습니다 (회계사 옵션 없음) */
  const professional: PartnerProfessionalType = "tax_advisor";
  const [license, setLicense] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [repName, setRepName] = useState("");
  const [sido, setSido] = useState("서울특별시");
  const [sigungu, setSigungu] = useState("강남구");
  const [specialties, setSpecialties] = useState("종합소득세, 부가세");
  const [referralCode, setReferralCode] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [bizFile, setBizFile] = useState<File | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/partners/founder-stats")
      .then((r) => r.json())
      .then((j) => {
        if (typeof j?.used === "number" && typeof j?.cap === "number") {
          setFounder({ used: j.used, cap: j.cap });
        }
      })
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatusMsg(null);
    setBusy(true);
    try {
      const fmt = validateLicenseFormat(license, professional);
      if (!fmt.ok) {
        setStatusMsg(fmt.message);
        return;
      }

      const certCheck = validatePartnerDoc(certFile, {
        required: true,
        label: "자격 증빙",
      });
      if (!certCheck.ok) {
        setStatusMsg(certCheck.message);
        return;
      }
      const bizCheck = validatePartnerDoc(bizFile, {
        required: false,
        label: "사업자등록증",
      });
      if (!bizCheck.ok) {
        setStatusMsg(bizCheck.message);
        return;
      }

      const lc = await fetch("/api/partners/license-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license, professional }),
      }).then((r) => r.json());

      if (!lc.formatOk) {
        setStatusMsg(lc.message ?? "자격번호 형식을 확인해 주세요.");
        return;
      }
      if (!lc.duplicateOk) {
        setStatusMsg("이미 등록된 자격번호입니다. 다른 번호를 입력하거나 고객센터로 문의해 주세요.");
        return;
      }

      let referrerPartnerId: string | null = null;
      if (referralCode.trim()) {
        const rr = await fetch(
          `/api/partners/referral-resolve?code=${encodeURIComponent(referralCode.trim())}`,
        ).then((r) => r.json());
        referrerPartnerId = rr.referrerPartnerId ?? null;
        if (!referrerPartnerId) {
          setStatusMsg("추천인 코드를 찾을 수 없습니다. 비워두거나 올바른 코드를 입력해 주세요.");
          return;
        }
      }

      const supabase = createBrowserClient();
      const { data: authData, error: signErr } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signErr || !authData.user) {
        setStatusMsg(signErr?.message ?? "가입에 실패했습니다.");
        return;
      }

      const normalized = normalizeLicenseNumber(license);
      const specs = specialties
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const { data: partnerRow, error: pErr } = await supabase
        .from("partners")
        .insert({
          user_id: authData.user.id,
          professional_type: professional,
          license_number_normalized: normalized,
          license_display: license.trim(),
          office_name: officeName.trim(),
          representative_name: repName.trim() || null,
          sido: sido.trim(),
          sigungu: sigungu.trim(),
          specialties: specs,
          status: "pending",
          referrer_partner_id: referrerPartnerId,
        })
        .select("id")
        .single();

      if (pErr || !partnerRow) {
        setStatusMsg(pErr?.message ?? "신청서 저장에 실패했습니다.");
        return;
      }

      const partnerId = partnerRow.id;

      async function upload(kind: "certificate" | "business_license", file: File) {
        const folder = kind === "certificate" ? "certificates" : "business_licenses";
        const path = `${folder}/${partnerId}/${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("partner_docs")
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const { error: dErr } = await supabase.from("partner_documents").insert({
          partner_id: partnerId,
          doc_type: kind === "certificate" ? "certificate" : "business_license",
          storage_path: path,
        });
        if (dErr) throw dErr;
      }

      if (certFile) await upload("certificate", certFile);
      if (bizFile) await upload("business_license", bizFile);

      setStatusMsg(
        "신청이 접수되었습니다. 관리자 검토 후 승인되면 대시보드에서 리드를 확인할 수 있습니다.",
      );
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-neutral-900">
          Founding Partner 한정 {founder.used}/{founder.cap}
        </p>
        <span className="text-xs text-neutral-500">
          실시간 선착순 현황(승인 완료 기준)
        </span>
      </div>
      <p className="text-xs leading-relaxed text-neutral-600">
        형식 확인 완료 / 중복 등록 여부 확인 완료 (최종 자격 진위는 관리자 서류 검토 후 승인)
      </p>

      <label className="block text-sm">
        <span className="font-medium text-neutral-800">로그인 이메일</span>
        <input
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-neutral-800">비밀번호</span>
        <input
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      <div className="block text-sm">
        <span className="font-medium text-neutral-800">전문가 구분</span>
        <div className="mt-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-800">
          세무·회계 전문가 (세무사)
        </div>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-neutral-800">자격(등록)번호</span>
        <input
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
          value={license}
          onChange={(e) => setLicense(e.target.value)}
          required
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-neutral-800">사무소명</span>
        <input
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
          value={officeName}
          onChange={(e) => setOfficeName(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-neutral-800">대표자명</span>
        <input
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
          value={repName}
          onChange={(e) => setRepName(e.target.value)}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-neutral-800">시·도</span>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
            value={sido}
            onChange={(e) => setSido(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-neutral-800">시·군·구</span>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
            value={sigungu}
            onChange={(e) => setSigungu(e.target.value)}
            required
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-neutral-800">전문 분야 (쉼표 구분)</span>
        <input
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
          value={specialties}
          onChange={(e) => setSpecialties(e.target.value)}
        />
        <span className="mt-1 block text-xs text-neutral-500">
          리드의 상황 키(예: income_tax)와 정확히 일치하면 매칭 가중치가 올라갑니다. 기장 리드는{" "}
          <span className="font-mono">bookkeeping_individual</span>·
          <span className="font-mono">bookkeeping_corp</span>(또는{" "}
          <span className="font-mono">bookkeeping</span>)을 넣으면 개인/법인·개업예정에 맞춰
          우선 배정됩니다.
        </span>
      </label>

      <label className="block text-sm">
        <span className="font-medium text-neutral-800">추천인 코드 (선택)</span>
        <input
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          placeholder="승인된 파트너의 코드"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-neutral-800">자격 증빙 (필수)</span>
        <input
          type="file"
          className="mt-1 w-full text-sm"
          accept={DOC_ACCEPT_ATTR}
          onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
          required
        />
        <span className="mt-1 block text-xs text-neutral-500">
          저장 경로: partner_docs/certificates/…
        </span>
      </label>

      <label className="block text-sm">
        <span className="font-medium text-neutral-800">사업자등록증 (선택)</span>
        <input
          type="file"
          className="mt-1 w-full text-sm"
          accept={DOC_ACCEPT_ATTR}
          onChange={(e) => setBizFile(e.target.files?.[0] ?? null)}
        />
        <span className="mt-1 block text-xs text-neutral-500">
          저장 경로: partner_docs/business_licenses/…
        </span>
      </label>

      {statusMsg ? (
        <p className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-800">
          {statusMsg}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-ink hover:bg-brand-light disabled:opacity-50"
      >
        {busy ? "처리 중…" : "세무·회계 전문가 입점 신청"}
      </button>
    </form>
  );
}
