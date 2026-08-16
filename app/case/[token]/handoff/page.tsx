import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { buildTaxCaseHandoffText } from "@/lib/tax-cases/handoff";
import { getTaxCaseByToken } from "@/lib/tax-cases/server";

export const metadata: Metadata = {
  title: "세무 검토 인계서",
  robots: { index: false, follow: false },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function TaxCaseHandoffPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!UUID_RE.test(token)) notFound();
  const taxCase = await getTaxCaseByToken(token);
  if (!taxCase) notFound();

  return (
    <div className="app-shell-frame pb-24 pt-10 print:max-w-none print:pb-0 print:pt-0">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <article className="mx-auto max-w-3xl border border-line bg-white p-6 sm:p-10 print:border-0 print:p-0">
        <p className="text-sm font-black text-[#6A442D]">FindTax</p>
        <h1 className="mt-2 text-3xl font-black text-ink">세무 검토 인계서</h1>
        <p className="mt-2 text-sm text-ink-muted">
          생성일 {new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul" }).format(new Date())}
        </p>
        <pre className="mt-8 whitespace-pre-wrap font-sans text-sm leading-7 text-ink">
          {buildTaxCaseHandoffText(taxCase)}
        </pre>
      </article>
    </div>
  );
}
