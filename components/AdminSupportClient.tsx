"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

type SupportItem = {
  id: string;
  created_at: string;
  type: string;
  email: string;
  pageUrl: string | null;
  device: string | null;
  subject: string;
  message: string;
  emailSent: boolean;
  emailError: string | null;
};

function supportTypeLabel(type: string) {
  switch (type) {
    case "bug":
      return "버그/오류";
    case "calculation":
      return "계산 결과 이상";
    case "login":
      return "로그인/회원가입";
    case "feature":
      return "기능 제안";
    default:
      return "기타 불편";
  }
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ko-KR");
}

export function AdminSupportClient() {
  const [items, setItems] = useState<SupportItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const supabase = createBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setError("로그인이 필요합니다.");
      setItems([]);
      return;
    }

    const res = await fetch("/api/admin/support", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      setError("관리자 권한이 없거나 세션이 만료되었습니다.");
      setItems([]);
      return;
    }

    const json = (await res.json()) as { items?: SupportItem[] };
    setItems(json.items ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">
          서비스 문의는 Supabase에 저장되고, 메일 발송 여부도 함께 기록됩니다.
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          새로고침
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      {items.length === 0 && !error ? (
        <div className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-600">
          아직 저장된 서비스 문의가 없습니다.
        </div>
      ) : null}

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700">
                    {supportTypeLabel(item.type)}
                  </span>
                  <span className="text-xs text-neutral-500">{formatDate(item.created_at)}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      item.emailSent
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {item.emailSent ? "메일 발송 완료" : "메일 발송 실패"}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-neutral-900">{item.subject}</h2>
              </div>
              <a
                href={`mailto:${item.email}`}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                이메일 답장
              </a>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-neutral-600 sm:grid-cols-2">
              <p>
                <strong className="font-semibold text-neutral-800">회신 이메일:</strong> {item.email || "-"}
              </p>
              <p>
                <strong className="font-semibold text-neutral-800">사용 기기:</strong> {item.device || "-"}
              </p>
              <p className="sm:col-span-2">
                <strong className="font-semibold text-neutral-800">문제 페이지:</strong>{" "}
                {item.pageUrl ? (
                  <a href={item.pageUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    {item.pageUrl}
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm leading-relaxed text-neutral-700">
              {item.message}
            </div>

            {!item.emailSent && item.emailError ? (
              <p className="mt-3 text-xs text-amber-800">메일 오류 기록: {item.emailError}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
