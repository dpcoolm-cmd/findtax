import { notFound, permanentRedirect } from "next/navigation";
import { regionAccountantPath } from "@/lib/seo/urls";
import {
  getTaxAccountantById,
  listTaxAccountantProfileIds,
} from "@/lib/tax-accountants";

// This legacy alias is build-time redirected and does not need its own ISR page.
export const dynamicParams = false;

export async function generateStaticParams() {
  return listTaxAccountantProfileIds();
}

export default async function TaxAccountantProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { accountant, error } = await getTaxAccountantById(id);
  if (!accountant || error) notFound();
  permanentRedirect(
    regionAccountantPath(accountant.sido, accountant.sigungu, accountant.slug),
  );
}
