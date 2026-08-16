"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RegisterLiveStats } from "@/components/RegisterLiveStats";
import { createBrowserClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const SPECIALTY_OPTIONS = [
  "종합소득세",
  "양도세",
  "법인세",
  "증여세",
  "상속세",
  "세무기장",
  "폐업신고",
  "부가세",
];

type Plan = "FREE" | "STANDARD" | "PREMIUM";

const PLANS: { value: Plan; label: string; price: string; features: string[]; highlight?: boolean }[] = [
  {
    value: "FREE",
    label: "FREE · 기본",
    price: "무료",
    features: [
      "이름·사무소·연락처 기본 노출",
      "지역 검색 결과 노출",
      "상세 프로필 페이지 생성",
    ],
  },
  {
    value: "STANDARD",
    label: "STANDARD",
    price: "월 30,000원",
    highlight: true,
    features: [
      "FREE 포함 전체",
      "배지 + 검색 상단 노출",
      "전문분야 태그 표시",
      "프로필 사진 등록",
      "상담 신청 버튼 활성화",
    ],
  },
  {
    value: "PREMIUM",
    label: "PREMIUM",
    price: "월 100,000원",
    features: [
      "STANDARD 포함 전체",
      "추천 배지 + 최상단 고정",
      "블로그 글 연관 세무사 노출",
      "방문자 통계 제공",
      "한줄 소개·약력 강조 표시",
      "리뷰 수집 기능",
    ],
  },
];

// ─── Google Login Gate ───────────────────────────────────────────────────────

function GoogleLoginGate() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = createBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/register`,
      },
    });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="rounded-2xl border border-line bg-surface p-8 shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1rem] border border-brand bg-brand/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-brand">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-ink">로그인이 필요합니다</h2>
        <p className="mt-3 text-sm leading-7 text-ink-muted">
          세무사 등록 전 Google 계정으로 본인 확인을 완료해 주세요. 계정 정보는 등록·관리 목적으로만 사용됩니다.
        </p>
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white py-3.5 text-sm font-semibold text-ink shadow-sm transition hover:border-line-strong hover:shadow disabled:opacity-60"
        >
          <GoogleIcon />
          {loading ? "이동 중…" : "Google로 로그인"}
        </button>
        <p className="mt-4 text-xs text-ink-soft">
          로그인 후 자동으로 등록 페이지로 돌아옵니다.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Registration Form ───────────────────────────────────────────────────────

function RegisterForm({ user }: { user: User }) {
  const formRef = useRef<HTMLDivElement | null>(null);
  const [plan, setPlan] = useState<Plan>("FREE");
  const [name, setName] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user.email ?? "");
  const [address, setAddress] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollToForm = useCallback((p: Plan) => {
    setPlan(p);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const toggleSpecialty = (id: string) => {
    setSpecialties((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) { setError("이름을 입력해 주세요."); return; }
    if (officeName.trim().length < 2) { setError("사무소명을 입력해 주세요."); return; }
    if (phone.trim().length < 8) { setError("연락처를 입력해 주세요."); return; }
    if (!email.includes("@")) { setError("이메일을 확인해 주세요."); return; }
    if (address.trim().length < 4) { setError("사무소 주소를 입력해 주세요."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          office_name: officeName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          specialties,
          plan,
          bio: bio.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="app-shell-frame py-14">
          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand-dark">
              전국 13,000+ 세무사 데이터 보유
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-ink md:text-5xl">
              findtax.kr
              <br />
              <span className="text-brand-dark">세무사 파트너</span> 입점
            </h1>
            <p className="mt-5 text-base leading-8 text-ink-muted">
              이미 내 정보가 등록되어 있습니다. 직접 관리하고, 더 많은 고객을 만나세요.
            </p>
            <div className="mt-2 text-xs text-ink-soft">
              Google 계정으로 로그인됨 — {user.email}
            </div>
            <RegisterLiveStats />
          </div>
        </div>
      </section>

      {/* Why register */}
      <section className="app-shell-frame py-14">
        <h2 className="text-center text-2xl font-bold text-ink">왜 입점해야 할까요</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            {
              label: "01",
              title: "고객에게 수수료 없음",
              body: "이용자에게 상담·연결 비용을 받지 않아 가격 저항 없이 고객이 찾아옵니다.",
            },
            {
              label: "02",
              title: "계산하고 온 고객",
              body: "계산기를 써본 고객은 이미 세금에 관심이 있어 상담으로 이어질 가능성이 훨씬 높습니다.",
            },
            {
              label: "03",
              title: "연결된 리드에만 과금",
              body: "고정 광고비 없이 실제 상담 연결 시에만 합리적인 수수료가 발생합니다.",
            },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-line bg-surface p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">{c.label}</p>
              <h3 className="mt-3 text-lg font-semibold text-ink">{c.title}</h3>
              <p className="mt-2 text-sm leading-7 text-ink-muted">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="border-t border-line">
        <div className="app-shell-frame py-14">
          <h2 className="text-center text-2xl font-bold text-ink">노출 플랜 비교</h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.value}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  p.highlight
                    ? "border-brand bg-brand text-ink shadow-soft"
                    : "border-line bg-surface"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
                    추천
                  </span>
                )}
                <p className={`text-xs font-semibold uppercase tracking-wider ${p.highlight ? "text-ink/70" : "text-ink-soft"}`}>
                  {p.label}
                </p>
                <p className={`mt-2 text-2xl font-bold ${p.highlight ? "text-ink" : "text-ink"}`}>
                  {p.price}
                </p>
                <ul className={`mt-5 flex-1 space-y-2 text-sm ${p.highlight ? "text-ink/80" : "text-ink-muted"}`}>
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className={`mt-0.5 flex-shrink-0 ${p.highlight ? "text-ink/55" : "text-brand-dark"}`}>·</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => scrollToForm(p.value)}
                  className={`mt-6 w-full rounded-xl py-3 text-sm font-semibold transition ${
                    p.highlight
                      ? "bg-ink text-white hover:bg-ink/90"
                      : "bg-brand text-ink hover:bg-brand-light"
                  }`}
                >
                  {p.value === "FREE" ? "무료로 정보 등록하기" : `${p.label} 시작하기`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="border-t border-line">
        <div className="app-shell-frame py-14">
          <div ref={formRef} className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-8">
              <h2 className="text-xl font-bold text-ink">지금 바로 내 정보 등록하기</h2>
              <p className="mt-2 text-sm text-ink-muted">
                기본 정보를 입력하시면 무료로 프로필이 생성됩니다.
              </p>

              {success ? (
                <div className="mt-6 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm font-medium text-brand">
                  신청이 완료되었습니다. 확인 후 순차적으로 연락드리겠습니다.
                </div>
              ) : null}
              {error ? (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              ) : null}

              {!success && (
                <form className="mt-8 space-y-5" onSubmit={onSubmit}>
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-ink">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:ring-1 focus:ring-brand"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      placeholder="홍길동"
                    />
                  </div>

                  {/* Office name */}
                  <div>
                    <label className="block text-sm font-semibold text-ink">
                      사무소명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:ring-1 focus:ring-brand"
                      value={officeName}
                      onChange={(e) => setOfficeName(e.target.value)}
                      placeholder="홍길동 세무회계사무소"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-ink">
                      연락처 <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="tel"
                      className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:ring-1 focus:ring-brand"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      placeholder="010-0000-0000"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-ink">
                      이메일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:ring-1 focus:ring-brand"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-semibold text-ink">
                      사무소 주소 <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:ring-1 focus:ring-brand"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      autoComplete="street-address"
                      placeholder="서울특별시 강남구 테헤란로 123"
                    />
                  </div>

                  {/* Specialties */}
                  <fieldset>
                    <legend className="text-sm font-semibold text-ink">전문분야 (복수 선택)</legend>
                    <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {SPECIALTY_OPTIONS.map((s) => {
                        const checked = specialties.includes(s);
                        return (
                          <label
                            key={s}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                              checked
                                ? "border-brand bg-brand text-ink"
                                : "border-line bg-white text-ink-muted hover:border-brand/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSpecialty(s)}
                              className="sr-only"
                            />
                            {s}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* Plan */}
                  <fieldset>
                    <legend className="text-sm font-semibold text-ink">
                      관심 플랜 <span className="text-red-500">*</span>
                    </legend>
                    <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {(
                        [
                          ["FREE", "FREE (무료)"],
                          ["STANDARD", "STANDARD (월 3만원)"],
                          ["PREMIUM", "PREMIUM (월 10만원)"],
                        ] as const
                      ).map(([value, label]) => (
                        <label
                          key={value}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition ${
                            plan === value
                              ? "border-brand bg-brand/10 font-semibold text-brand"
                              : "border-line bg-white text-ink-muted hover:border-brand/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name="plan"
                            value={value}
                            checked={plan === value}
                            onChange={() => setPlan(value)}
                            className="sr-only"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-semibold text-ink">
                      한줄 소개 (선택)
                    </label>
                    <textarea
                      className="mt-1.5 min-h-[88px] w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:ring-1 focus:ring-brand"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="납세자의 재산을 지키는 세무사입니다"
                      maxLength={2000}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-brand py-3.5 text-sm font-bold text-ink shadow-sm transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "전송 중…" : "파트너 등록 신청하기"}
                  </button>
                </form>
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-line bg-surface p-6 text-center">
              <p className="text-sm font-semibold text-ink">궁금한 점이 있으신가요?</p>
              <a
                href="mailto:findtax@gmail.com"
                className="mt-2 block text-sm font-medium text-brand underline-offset-2 hover:underline"
              >
                findtax@gmail.com
              </a>
              <p className="mt-3 text-xs text-ink-soft">
                현재 얼리 파트너 모집 중 — 첫 3개월 STANDARD 무료 혜택
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (user === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <GoogleLoginGate />;
  }

  return <RegisterForm user={user} />;
}
