"use client";

import { useMemo, useState } from "react";
import { Mail } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";
import { trackSiteEvent } from "@/lib/site-track";

export function MagicLinkAuthForm({
  claimToken,
  buttonLabel = "이메일로 계속하기",
}: {
  claimToken?: string;
  buttonLabel?: string;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || state === "sending") return;
    setState("sending");

    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", "/my-taxes");
    if (claimToken) callback.searchParams.set("claim", claimToken);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callback.toString(),
        shouldCreateUser: true,
      },
    });

    if (error) {
      setState("error");
      return;
    }

    trackSiteEvent("tax_magic_link_sent", {
      caseType: claimToken ? "vat" : "account",
    });
    setState("sent");
  };

  if (state === "sent") {
    return (
      <div className="flex items-start gap-3 rounded-lg bg-[#E8F6DF] p-4">
        <Mail className="mt-0.5 shrink-0 text-[#296B2F]" size={20} />
        <div>
          <p className="font-bold text-ink">이메일을 확인해 주세요.</p>
          <p className="mt-1 text-sm leading-6 text-ink-muted">
            받은 링크를 누르면 로그인되고 준비상태가 자동으로 저장됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor={claimToken ? "case-email" : "login-email"}>
        이메일
      </label>
      <input
        id={claimToken ? "case-email" : "login-email"}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="이메일 주소"
        className="min-h-12 min-w-0 flex-1 rounded-lg border border-line px-4 text-base"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="btn-primary shrink-0 disabled:cursor-wait disabled:opacity-60"
      >
        {state === "sending" ? "보내는 중..." : buttonLabel}
      </button>
      {state === "error" ? (
        <p className="text-sm text-red-700 sm:basis-full">
          이메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}
    </form>
  );
}

