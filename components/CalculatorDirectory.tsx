import Link from "next/link";
import { ArrowRight, Calculator, Star } from "lucide-react";
import { CALCULATOR_DIRECTORY } from "@/lib/seo/calculators";

export function CalculatorDirectory({
  title = "필요한 계산기를 한 곳에서 선택하세요.",
  description = "많이 쓰는 계산기는 먼저 보이도록 강조하고, 전체 계산기는 같은 목록 안에서 바로 이동할 수 있게 정리했습니다.",
  dark = false,
}: {
  title?: string;
  description?: string;
  dark?: boolean;
}) {
  return (
    <section id="calculators" className={dark ? "bg-primary text-white" : "bg-white"}>
      <div className="app-shell-frame app-section">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.45fr)] lg:items-end">
          <div>
            <p className={dark ? "text-sm font-bold text-brand" : "text-sm font-bold text-brand-dark"}>
              세금 계산기
            </p>
            <h2 className={`mt-3 max-w-4xl text-3xl font-extrabold leading-tight md:text-4xl ${dark ? "text-white" : "text-ink"}`}>
              {title}
            </h2>
          </div>
          <p className={`text-base leading-7 ${dark ? "text-white/60" : "text-ink-muted"}`}>
            {description}
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CALCULATOR_DIRECTORY.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`group flex min-h-[168px] flex-col rounded-lg border p-5 transition-colors duration-200 ${
                item.featured
                  ? "border-primary bg-primary text-white hover:bg-primary-hover"
                  : dark
                    ? "border-white/20 bg-white/5 text-white hover:border-brand"
                    : "border-line bg-white text-ink hover:border-line-strong hover:bg-surface-muted"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${
                    item.featured ? "bg-brand text-brand-dark" : dark ? "bg-white/10 text-white" : "bg-surface-muted text-ink"
                  }`}
                >
                  <Calculator size={20} />
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                    item.featured
                      ? "bg-brand text-brand-dark"
                      : dark
                        ? "bg-white/10 text-white/75"
                        : "bg-bg-muted text-ink-muted"
                  }`}
                >
                  {item.featured ? <Star size={13} fill="currentColor" /> : null}
                  {item.featured ? "추천" : item.category}
                </span>
              </div>

              <h3 className={`mt-5 text-xl font-extrabold ${item.featured ? "text-white" : !dark ? "text-ink" : "text-white"}`}>
                {item.title}
              </h3>
              <p className={`mt-2 text-sm leading-6 ${item.featured ? "text-white/70" : dark ? "text-white/60" : "text-ink-muted"}`}>
                {item.description}
              </p>
              <span
                className={`mt-auto flex h-10 w-10 items-center justify-center rounded-full transition-transform group-hover:translate-x-1 ${
                  item.featured ? "bg-brand text-brand-dark" : dark ? "bg-white/10 text-white" : "bg-surface-muted text-ink"
                }`}
              >
                <ArrowRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
