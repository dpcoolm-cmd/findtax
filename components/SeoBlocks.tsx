import Link from "next/link";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import type { FaqItem, InternalLink } from "@/lib/seo/auto-content";

export function SeoBodyText({ text }: { text: string }) {
  return (
    <div className="max-w-none text-base leading-8 text-ink-muted">
      {text.split(/\n\n+/).map((para, i) => (
        <p key={i} className="mb-4 last:mb-0">
          {para}
        </p>
      ))}
    </div>
  );
}

export function FaqSection({ items }: { items: FaqItem[] }) {
  return (
    <section aria-labelledby="faq-heading" className="app-section py-12">
      <div className="mb-8 space-y-3">
        <SectionLabel>FAQ</SectionLabel>
        <h2 id="faq-heading">자주 묻는 질문</h2>
      </div>
      <dl className="space-y-4">
        {items.map((f, i) => (
          <SurfaceCard key={i} className="p-5">
            <dt className="text-base font-semibold text-ink">{f.question}</dt>
            <dd className="mt-3 text-sm leading-7 text-ink-muted">{f.answer}</dd>
          </SurfaceCard>
        ))}
      </dl>
    </section>
  );
}

export function InternalLinksSection({ links }: { links: InternalLink[] }) {
  return (
    <section aria-labelledby="related-heading" className="app-section py-12">
      <div className="mb-8 space-y-3">
        <SectionLabel>Explore</SectionLabel>
        <h2 id="related-heading">함께 보면 좋은 페이지</h2>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <SurfaceCard className="p-4 transition-colors hover:border-brand/40 hover:bg-surface-muted">
              <Link href={l.href} className="text-sm font-medium text-ink-muted hover:text-ink">
                {l.label}
              </Link>
            </SurfaceCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
