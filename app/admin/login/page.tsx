"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";

export default function AdminLoginPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (loading) return;
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });
    setLoading(false);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-12rem)] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <Link href="/" className="text-sm text-neutral-500 hover:text-brand">
        홈으로
      </Link>
      <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-brand">관리자 로그인</p>
        <h1 className="mt-2 text-2xl font-bold text-neutral-950">Findtax 운영 화면</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          관리자 이메일로 등록된 Google 계정만 접근할 수 있습니다. 로그인 후 권한이 없으면
          홈으로 이동합니다.
        </p>
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-ink shadow-md hover:bg-brand-light disabled:opacity-60"
        >
          {loading ? "이동 중..." : "Google로 관리자 로그인"}
        </button>
      </div>
    </div>
  );
}
