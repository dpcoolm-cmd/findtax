import { NextResponse } from "next/server";
import { listTaxAccountants } from "@/lib/tax-accountants";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sido = searchParams.get("sido") ?? undefined;
  const sigungu = searchParams.get("sigungu") ?? undefined;

  const result = await listTaxAccountants({ sido, sigungu });

  if (result.error && result.error !== "supabase_not_configured") {
    return NextResponse.json(
      { accountants: [], error: result.error },
      { status: 503 },
    );
  }

  return NextResponse.json({
    accountants: result.accountants,
    isEmpty: result.isEmpty,
    emptyMessage: result.emptyMessage,
    error: result.error,
  });
}
