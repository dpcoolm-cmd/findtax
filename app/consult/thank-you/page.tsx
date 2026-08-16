import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl, calculatorPath, situationPath } from "@/lib/seo/urls";

const path = "/consult/thank-you";

export const metadata: Metadata = {
  title: "상담 신청 완료",
  description: "상담 신청이 정상 접수되었습니다. 담당자가 확인 후 순차적으로 연락드립니다.",
  alternates: { canonical: absoluteUrl(path) },
  robots: { index: false, follow: false },
};

export default async function ConsultThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; token?: string }>;
}) {
  const { category, token } = await searchParams;
  const isBookkeeping = category === "bookkeeping";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <section className="rounded-lg border border-line bg-white p-6 text-center shadow-card sm:p-8">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          {isBookkeeping
            ? "기장 상담 신청 완료! 🎉 확인 후 기장료 견적 안내를 도와드립니다"
            : "상담 신청이 완료되었습니다! 🎉"}
        </h1>
        {isBookkeeping ? null : (
          <>
            <p className="mt-3 text-sm font-medium text-ink-muted sm:text-base">
              담당자가 확인 후 순차적으로 연락드릴 예정입니다
            </p>
            <p className="mt-2 text-sm font-medium text-ink-muted sm:text-base">
              기다리시는 동안 절세 꿀팁을 확인해보세요
            </p>
          </>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {token ? (
            <Link
              href={`/consult/status/${encodeURIComponent(token)}`}
              className="rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover sm:col-span-2"
            >
              상담 진행상태 확인하기
            </Link>
          ) : null}
          <Link
            href={situationPath("income_tax")}
            className="rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
          >
            절세 가이드(블로그) 보기
          </Link>
          <Link
            href={calculatorPath("종합소득세")}
            className="rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition-colors hover:bg-surface-muted"
          >
            세금 계산기 바로가기
          </Link>
        </div>

        <Link
          href="/"
          className="mt-4 inline-block text-sm font-semibold text-positive-deep hover:text-brand-dark hover:underline"
        >
          홈으로 이동
        </Link>
      </section>
    </div>
  );
}
