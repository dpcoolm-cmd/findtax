import Link from "next/link";
import { AdminLeadsClient } from "@/components/AdminLeadsClient";
import { AdminNav } from "@/components/AdminNav";

export const metadata = { title: "상담 운영", robots: { index: false, follow: false } };

export default function AdminLeadsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-sm text-ink-muted"><Link href="/" className="hover:text-ink">홈</Link> / 관리자</p>
      <h1 className="mt-4 text-3xl font-bold text-ink">상담 운영</h1>
      <p className="mt-2 text-sm text-ink-muted">신규 신청부터 전문가 배정, 연락, 상담 완료까지 관리합니다.</p>
      <AdminNav current="/admin/leads" />
      <div className="mt-8"><AdminLeadsClient /></div>
    </main>
  );
}
