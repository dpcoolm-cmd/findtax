import Link from "next/link";
import { PartnerDashboardClient } from "@/components/PartnerDashboardClient";

export const metadata = {
  title: "파트너 대시보드",
  robots: { index: false, follow: false },
};

export default function PartnerDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-neutral-600">
        <Link href="/" className="hover:text-brand">
          홈
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">파트너 대시보드</span>
      </nav>
      <h1 className="mt-4 text-2xl font-bold text-brand">파트너 대시보드</h1>
      <p className="mt-2 text-sm text-neutral-600">
        이름·연락처·상세 상담 내용은 Unlock 시점에 포인트가 차감됩니다.
      </p>
      <div className="mt-8">
        <PartnerDashboardClient />
      </div>
      <p className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 text-center text-sm">
        <Link href="/partner/pricing" className="font-medium text-brand hover:underline">
          요금제 안내
        </Link>
        <Link href="/partner/apply" className="font-medium text-brand hover:underline">
          입점 신청으로 이동
        </Link>
      </p>
    </div>
  );
}
