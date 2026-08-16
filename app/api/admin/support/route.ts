import { NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/lib/supabase-service";

type SupportItem = {
  id: string;
  created_at: string;
  type: string;
  email: string;
  pageUrl: string | null;
  device: string | null;
  subject: string;
  message: string;
  emailSent: boolean;
  emailError: string | null;
};

export async function GET(req: Request) {
  const admin = await getAdminUserFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("tracking_events")
    .select("id, event_type, payload, created_at")
    .eq("event_type", "support_request")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items: SupportItem[] = (data ?? []).map((row) => {
    const payload =
      row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : {};

    return {
      id: row.id,
      created_at: row.created_at,
      type: typeof payload.type === "string" ? payload.type : "other",
      email: typeof payload.email === "string" ? payload.email : "",
      pageUrl: typeof payload.pageUrl === "string" ? payload.pageUrl : null,
      device: typeof payload.device === "string" ? payload.device : null,
      subject: typeof payload.subject === "string" ? payload.subject : "",
      message: typeof payload.message === "string" ? payload.message : "",
      emailSent: payload.emailSent === true,
      emailError: typeof payload.emailError === "string" ? payload.emailError : null,
    };
  });

  return NextResponse.json({ items });
}
