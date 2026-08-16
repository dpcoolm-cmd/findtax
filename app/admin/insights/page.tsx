import Link from "next/link";
import { AdminInsightsClient } from "@/components/AdminInsightsClient";
import { AdminNav } from "@/components/AdminNav";

export const metadata = {
  title: "운영 인사이트",
  robots: { index: false, follow: false },
};

export default function AdminInsightsPage() {
  const allow = process.env.ADMIN_EMAILS?.trim() || process.env.ADMIN_EMAIL?.trim();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-neutral-600">
        <Link href="/" className="hover:text-brand">
          홈
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">관리자 / 운영 인사이트</span>
      </nav>

      <h1 className="mt-4 text-2xl font-bold text-brand">운영 인사이트</h1>
      <p className="mt-2 text-sm text-neutral-600">
        방문자수 트렌드, 유입 유형, 사용 페이지, 상담 전환 흐름을 한 화면에서 확인합니다.
      </p>
      <AdminNav current="/admin/insights" />

      {!allow ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          서버에 <code className="font-mono">ADMIN_EMAILS</code> 또는{" "}
          <code className="font-mono">ADMIN_EMAIL</code>이 설정되어 있지 않습니다.
          Vercel 또는 로컬 환경변수를 확인해 주세요.
        </p>
      ) : null}

      <div className="mt-8">
        <AdminInsightsClient />
      </div>
    </div>
  );
}
