import Link from "next/link";
import type { Metadata } from "next";
import { SupportRequestForm } from "@/components/SupportRequestForm";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { absoluteUrl } from "@/lib/seo/urls";

const path = "/support";

export const metadata: Metadata = {
  title: "서비스 문의",
  description: "로그인, 화면 오류, 계산기 불편, 기능 제안 등 FindTax 서비스 운영 문의를 남길 수 있습니다.",
  alternates: { canonical: absoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    url: absoluteUrl(path),
    title: "FindTax 서비스 문의",
    description: "로그인 문제, 오류 신고, 기능 제안 등 서비스 운영 문의를 남겨 주세요.",
  },
};

export default function SupportPage() {
  return (
    <div className="app-shell-frame pb-24 pt-10 md:pb-28">
      <div className="space-y-10">
        <section className="space-y-5 border-b border-line pb-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <Link href="/" className="hover:text-ink">
              홈
            </Link>
            <span>/</span>
            <span className="text-ink">서비스 문의</span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(260px,0.55fr)] lg:items-start">
            <div className="space-y-4">
              <SectionLabel>service support</SectionLabel>
              <h1 className="max-w-3xl text-[3.75rem] leading-[0.95] md:text-[5rem]">서비스 문의</h1>
            </div>
            <p className="pt-2 text-right text-ink-muted">
              로그인 문제, 화면 오류, 계산기 불편, 기능 제안 같은 운영 문의를 남길 수 있습니다.
              세무 해석이나 절세 상담은{" "}
              <Link href="/consult" className="underline underline-offset-4 hover:text-ink">
                상담 신청
              </Link>
              으로 분리해 두었습니다.
            </p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_320px]">
          <SurfaceCard className="p-6 sm:p-8">
            <SupportRequestForm />
          </SurfaceCard>

          <SurfaceCard muted className="p-6">
            <div className="space-y-6">
              <div>
                <p className="font-display text-2xl text-ink">문의 전에 확인하면 좋아요</p>
                <p className="mt-3 text-sm leading-7 text-ink-muted">
                  문제 화면 주소, 사용 기기, 어떤 버튼을 눌렀는지까지 적어 주시면 더 빠르게 확인할 수 있습니다.
                </p>
              </div>

              <div className="space-y-3 text-sm leading-7 text-ink-muted">
                <p>• 버그/오류: 오류 문구, 재현 순서</p>
                <p>• 계산기 불편: 어떤 입력이 헷갈렸는지</p>
                <p>• 기능 제안: 어떤 상황에서 필요했는지</p>
                <p>• 로그인 문제: 사용한 로그인 방식, 발생 시점</p>
              </div>

              <div className="rounded-2xl border border-line bg-bg px-4 py-4 text-sm leading-7 text-ink-soft">
                답변 기준 시간: 영업일 기준 1~2일
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
