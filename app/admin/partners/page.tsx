import Link from "next/link";
import { AdminPartnersClient } from "@/components/AdminPartnersClient";
import { AdminNav } from "@/components/AdminNav";

export const metadata = {
  title: "파트너 승인",
  robots: { index: false, follow: false },
};

export default function AdminPartnersPage() {
  const allow = process.env.ADMIN_EMAILS?.trim();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-neutral-600">
        <Link href="/" className="hover:text-brand">
          홈
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">관리자 / 파트너</span>
      </nav>
      <h1 className="mt-4 text-2xl font-bold text-brand">파트너 서류 검토</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Supabase 로그인 후, 환경변수{" "}
        <code className="rounded bg-neutral-100 px-1">ADMIN_EMAILS</code>에 등록된
        관리자 이메일로만 API가 허용됩니다.
      </p>
      <AdminNav current="/admin/partners" />
      {!allow ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          서버에 <code className="font-mono">ADMIN_EMAILS</code>가 설정되어 있지 않습니다.
          Vercel/로컬 환경변수를 확인해 주세요.
        </p>
      ) : null}
      <div className="mt-8">
        <AdminPartnersClient />
      </div>
    </div>
  );
}
