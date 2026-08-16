"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookmarkCheck } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { MagicLinkAuthForm } from "@/components/MagicLinkAuthForm";
import { createBrowserClient } from "@/lib/supabase";
import { trackSiteEvent } from "@/lib/site-track";
import type { TaxCaseType } from "@/lib/tax-cases/guided-case-definitions";

export function TaxCaseSavePanel({
  token,
  caseType,
}: {
  token: string;
  caseType: TaxCaseType;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const claim = async () => {
    if (!user || state === "saving") return;
    setState("saving");
    const { data, error } = await supabase.rpc("api_claim_tax_case_v2", {
      p_access_token: token,
    });
    if (error || data !== true) {
      setState("error");
      return;
    }
    trackSiteEvent("tax_case_claimed", { caseType });
    setState("saved");
    window.dispatchEvent(new Event("tax-case-claimed"));
  };

  if (!ready) {
    return <div className="mt-8 h-24 animate-pulse rounded-lg bg-white/60" aria-hidden="true" />;
  }

  if (state === "saved") {
    return (
      <section className="mt-8 flex flex-col gap-4 rounded-lg border border-[#B8D9A5] bg-[#F3FAEE] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <BookmarkCheck className="mt-0.5 shrink-0 text-[#296B2F]" size={22} />
          <div>
            <p className="font-bold text-ink">내 세금에 저장됐어요.</p>
            <p className="mt-1 text-sm text-ink-muted">다음에 로그인해도 이어서 확인할 수 있습니다.</p>
          </div>
        </div>
        <Link href="/my-taxes" className="btn-secondary shrink-0 text-sm font-bold">
          내 세금 보기
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-lg border border-line bg-white p-5 sm:p-6">
      <p className="text-sm font-bold text-[#6A442D]">나중에 이어보기</p>
      <h2 className="mt-2 text-xl font-black text-ink">이 준비상태를 내 이메일에 저장하세요.</h2>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        비밀번호 없이 이메일 링크 한 번으로 저장됩니다.
      </p>
      <div className="mt-4">
        {user ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => void claim()}
              disabled={state === "saving"}
              className="btn-primary shrink-0 disabled:cursor-wait disabled:opacity-60"
            >
              {state === "saving" ? "저장하는 중..." : "내 세금에 저장"}
            </button>
            <p className="truncate text-sm text-ink-muted">{user.email}</p>
          </div>
        ) : (
          <MagicLinkAuthForm claimToken={token} buttonLabel="이메일로 저장" />
        )}
        {state === "error" ? (
          <p className="mt-3 text-sm text-red-700">
            저장하지 못했습니다. 이미 다른 계정에 저장된 링크인지 확인해 주세요.
          </p>
        ) : null}
      </div>
    </section>
  );
}
