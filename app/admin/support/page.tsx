import Link from "next/link";
import { AdminSupportClient } from "@/components/AdminSupportClient";
import { AdminNav } from "@/components/AdminNav";

export const metadata = {
  title: "서비스 문의함",
  robots: { index: false, follow: false },
};

export default function AdminSupportPage() {
  const allow = process.env.ADMIN_EMAILS?.trim();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-neutral-600">
        <Link href="/" className="hover:text-brand">
          홈
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">관리자 / 서비스 문의</span>
      </nav>
      <h1 className="mt-4 text-2xl font-bold text-brand">서비스 문의함</h1>
      <p className="mt-2 text-sm text-neutral-600">
        /support로 접수된 서비스 문의를 확인할 수 있습니다. 메일 발송 여부와 함께 Supabase에 저장된 기록을 보여줍니다.
      </p>
      <AdminNav current="/admin/support" />
      {!allow ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          서버에 <code className="font-mono">ADMIN_EMAILS</code>가 설정되어 있지 않습니다. Vercel 또는 로컬 환경변수를
          확인해 주세요.
        </p>
      ) : null}
      <div className="mt-8">
        <AdminSupportClient />
      </div>
    </div>
  );
}
