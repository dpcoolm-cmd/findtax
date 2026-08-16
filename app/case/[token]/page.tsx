import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaxCaseDashboardClient } from "@/components/TaxCaseDashboardClient";
import { getTaxCaseByToken } from "@/lib/tax-cases/server";

export const metadata: Metadata = {
  title: "내 세금 준비",
  robots: { index: false, follow: false },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function TaxCasePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!UUID_RE.test(token)) notFound();

  const taxCase = await getTaxCaseByToken(token);
  if (!taxCase) notFound();

  return <TaxCaseDashboardClient initialTaxCase={taxCase} />;
}
