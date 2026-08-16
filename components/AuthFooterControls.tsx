"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function AuthFooterControls() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      setReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  if (!ready || !user) return null;

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
      <Link href="/my-taxes" className="font-bold hover:text-white">
        내 세금
      </Link>
      <span className="truncate">{user.email}</span>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="rounded-full border border-line px-3 py-1.5 text-sm hover:text-ink disabled:opacity-60"
      >
        {loading ? "로그아웃 중…" : "로그아웃"}
      </button>
    </div>
  );
}
