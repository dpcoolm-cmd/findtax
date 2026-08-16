"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function PartnerRegistrationButton({
  label = "전문가 입점",
  className = "",
  onNavigate,
}: {
  label?: string;
  className?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleClick = async () => {
    onNavigate?.();
    if (loading) return;

    if (user) {
      router.push("/register");
      return;
    }

    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/register`,
      },
    });
    setLoading(false);
  };

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={className}>
      {loading ? "이동 중…" : label}
    </button>
  );
}
