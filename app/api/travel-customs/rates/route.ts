import { NextResponse } from "next/server";
import { parseCustomsExchangeXml } from "@/lib/calculators/customs-exchange";

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? "";
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) return NextResponse.json({ status: "invalid_date" }, { status: 400 });
  const todayKst = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (date > todayKst) return NextResponse.json({ status: "rate_not_yet_published" }, { status: 422 });
  const key = process.env.CUSTOMS_EXCHANGE_API_KEY?.trim();
  if (!key) return NextResponse.json({ status: "key_not_configured" }, { status: 503 });
  const url = new URL("https://apis.data.go.kr/1220000/retrieveTrifFxrtInfo/getRetrieveTrifFxrtInfo");
  url.searchParams.set("serviceKey", key);
  url.searchParams.set("aplyBgnDt", date.replaceAll("-", ""));
  url.searchParams.set("weekFxrtTpcd", "2");
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 21600 } });
    if (!response.ok) return NextResponse.json({ status: "upstream_unavailable" }, { status: 503 });
    const parsed = parseCustomsExchangeXml(await response.text(), date);
    if (!parsed.ok) return NextResponse.json({ status: parsed.reason }, { status: 503 });
    return NextResponse.json({ status: "verified_import_rates", unit: "KRW_per_1_currency_unit", rates: parsed.rates, source: "https://www.data.go.kr/data/15101230/openapi.do" });
  } catch {
    return NextResponse.json({ status: "upstream_unavailable" }, { status: 503 });
  }
}
