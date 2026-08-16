/**
 * home-atoz.kr — 계산기 하단 CTA 블록.
 * `policy.ts`의 `HomeAtozCtaSpec`을 받아 렌더링합니다. Next.js `app` 라우터에서 복사해 사용하세요.
 */
"use client";

import Link from "next/link";
import type { HomeAtozCtaSpec } from "./policy";
import { ctaBoxClass } from "./policy";

export function HomeAtozCtaBlock({ spec }: { spec: HomeAtozCtaSpec }) {
  const box = ctaBoxClass(spec.visual);
  const btn =
    "mt-3 inline-flex items-center rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50";

  return (
    <div className={`rounded-xl border px-4 py-3 shadow-sm ${box}`}>
      <p className="whitespace-pre-line text-sm font-medium leading-relaxed">{spec.title}</p>
      {spec.external ? (
        <a
          className={btn}
          href={spec.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {spec.buttonLabel}
        </a>
      ) : (
        <Link className={btn} href={spec.href}>
          {spec.buttonLabel}
        </Link>
      )}
    </div>
  );
}
