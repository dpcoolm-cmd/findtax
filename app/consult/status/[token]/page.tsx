import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase-service";

export const metadata = {
  title: "상담 진행상태",
  robots: { index: false, follow: false },
};

const STATUS_COPY = {
  new: ["접수 완료", "신청 내용을 확인하고 있습니다."],
  assigned: ["전문가 배정", "상담 가능한 전문가에게 요청을 전달했습니다."],
  contacted: ["연락 진행", "담당자가 연락을 시작했습니다."],
  consulting: ["상담 진행 중", "전문가와 상담이 진행 중입니다."],
  completed: ["상담 완료", "요청하신 상담이 완료되었습니다."],
  closed: ["처리 종료", "상담 요청 처리가 종료되었습니다."],
} as const;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default async function ConsultStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!isUuid(token)) notFound();

  const supabase = createServiceRoleClient();
  if (!supabase) notFound();
  const { data: lead } = await supabase
    .from("leads")
    .select("workflow_status, created_at, updated_at")
    .eq("public_tracking_token", token)
    .maybeSingle();
  if (!lead) notFound();

  const status = lead.workflow_status in STATUS_COPY
    ? (lead.workflow_status as keyof typeof STATUS_COPY)
    : "new";
  const [title, description] = STATUS_COPY[status];
  const steps = Object.keys(STATUS_COPY) as Array<keyof typeof STATUS_COPY>;
  const currentIndex = steps.indexOf(status);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <header>
        <p className="text-sm font-semibold text-positive-deep">상담 진행상태</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">{title}</h1>
        <p className="mt-3 text-ink-muted">{description}</p>
      </header>

      <ol className="mt-8 border-y border-line py-2">
        {steps.slice(0, 5).map((step, index) => {
          const reached = index <= currentIndex && status !== "closed";
          return (
            <li key={step} className="flex items-center gap-3 border-b border-line py-4 last:border-b-0">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${reached ? "bg-primary text-white" : "bg-surface-muted text-ink-muted"}`}>
                {index + 1}
              </span>
              <span className={reached ? "font-semibold text-ink" : "text-ink-muted"}>
                {STATUS_COPY[step][0]}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-5 text-sm text-ink-muted">
        접수일 {new Date(lead.created_at).toLocaleDateString("ko-KR")} · 마지막 갱신 {new Date(lead.updated_at).toLocaleString("ko-KR")}
      </p>
      <Link href="/" className="mt-8 inline-flex rounded-lg border border-line px-4 py-3 text-sm font-semibold text-ink hover:bg-surface-muted">
        홈으로 돌아가기
      </Link>
    </main>
  );
}
