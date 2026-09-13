"use client";

import Link from "next/link";
import { trackSiteEvent } from "@/lib/site-track";

type BlogPostCtaProps = {
  slug: string;
  title: string;
  description: string;
  href: string;
  calculatorType: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

function trackBlogCta(input: {
  slug: string;
  target: string;
  href: string;
  calculatorType: string;
}) {
  trackSiteEvent("blog_cta_click", {
        blog_slug: input.slug,
        target: input.target,
        href: input.href,
        calculator_type: input.calculatorType,
        path: typeof window !== "undefined" ? window.location.pathname : undefined,
        destination: input.href,
        placement: "article_end",
  });
}

export function BlogPostCta({
  slug,
  title,
  description,
  href,
  calculatorType,
  secondaryHref = "/consult",
  secondaryLabel = "세무사 상담 받기",
}: BlogPostCtaProps) {
  return (
    <div className="mt-12 rounded-lg border border-line-strong bg-surface-muted p-6">
      <p className="text-xs font-bold uppercase text-positive-deep">다음 단계</p>
      <h2 className="mt-3 text-2xl font-black leading-tight text-neutral-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-neutral-700">{description}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={href}
          onClick={() =>
            trackBlogCta({
              slug,
              href,
              calculatorType,
              target: "calculator",
            })
          }
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand px-5 text-sm font-bold text-brand-dark transition-colors hover:bg-brand-light"
        >
          계산기로 확인하기
        </Link>
        <Link
          href={secondaryHref}
          onClick={() =>
            trackBlogCta({
              slug,
              href: secondaryHref,
              calculatorType,
              target: secondaryHref.startsWith("/consult") ? "consult" : "calculator",
            })
          }
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-bold text-neutral-900 transition hover:border-neutral-900"
        >
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}
