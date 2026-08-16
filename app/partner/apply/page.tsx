import Link from "next/link";
import { PartnerApplyForm } from "@/components/PartnerApplyForm";

export const metadata = {
  title: "세무·회계 전문가 입점",
  robots: { index: false, follow: false },
};

const reasonCopy: Record<string, string> = {
  login: "대시보드 이용을 위해 로그인이 필요합니다.",
  no_profile: "파트너 신청 정보가 없습니다. 아래 양식으로 입점 신청을 완료해 주세요.",
  pending: "관리자 승인 대기 중입니다. 승인 완료 후 대시보드에서 리드를 확인할 수 있습니다.",
  rejected: "신청이 반려되었습니다. 안내 메일 또는 고객센터를 확인해 주세요.",
  admin_login: "관리자 페이지 접근을 위해 로그인해 주세요.",
};

export default async function PartnerApplyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const raw = sp.reason;
  const reason = typeof raw === "string" ? raw : "";
  const notice = reason ? reasonCopy[reason] ?? null : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-neutral-600">
        <Link href="/" className="hover:text-brand">
          홈
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">전문가 입점</span>
      </nav>
      <h1 className="mt-4 text-2xl font-bold text-brand">세무·회계 전문가 입점</h1>
      <p className="mt-2 text-sm text-neutral-600">
        findtax.kr 파트너로 등록하고 리드 매칭·포인트 정산 혜택을 받으세요.
      </p>
      {notice ? (
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          {notice}
        </div>
      ) : null}
      <div className="mt-8">
        <PartnerApplyForm />
      </div>
      <p className="mt-6 text-center text-sm text-neutral-500">
        이미 계정이 있나요?{" "}
        <Link href="/partner/dashboard" className="font-medium text-brand hover:underline">
          파트너 대시보드
        </Link>
      </p>
    </div>
  );
}
