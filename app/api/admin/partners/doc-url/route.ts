import { NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/lib/supabase-service";

function isSafeDocPath(path: string): boolean {
  if (!path || path.includes("..")) return false;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return (
    p.startsWith("certificates/") ||
    p.startsWith("business_licenses/")
  );
}

export async function POST(req: Request) {
  const admin = await getAdminUserFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const path = typeof (body as { path?: unknown }).path === "string"
    ? (body as { path: string }).path
    : "";
  if (!isSafeDocPath(path)) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { data, error } = await supabase.storage
    .from("partner_docs")
    .createSignedUrl(path, 60 * 30);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? "sign_failed" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
