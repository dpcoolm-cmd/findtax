import type { Metadata } from "next";
import { MagicLinkAuthForm } from "@/components/MagicLinkAuthForm";
import { MyTaxesClient } from "@/components/MyTaxesClient";
import { createAuthenticatedServerClient } from "@/lib/supabase-auth-server";
import { parseMyTaxCases } from "@/lib/tax-cases/customer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "내 세금 운영표",
  robots: { index: false, follow: false },
};

export default async function MyTaxesPage() {
  const supabase = await createAuthenticatedServerClient();
  const { data } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  if (!data.user?.email || !supabase) {
    return (
      <div className="app-shell-frame pb-24 pt-12 md:pb-28">
        <div className="mx-auto max-w-xl">
          <p className="text-sm font-bold text-[#6A442D]">내 세금 운영표</p>
          <h1 className="mt-3 text-3xl font-black text-ink sm:text-4xl">
            저장한 세금 일정과 다음 할 일을 확인하세요.
          </h1>
          <p className="mt-4 leading-7 text-ink-muted">
            비밀번호 없이 이메일 링크로 로그인하고 지난 진단을 그대로 이어갑니다.
          </p>
          <div className="mt-8 rounded-lg border border-line bg-white p-5 sm:p-6">
            <MagicLinkAuthForm buttonLabel="로그인 링크 받기" />
          </div>
        </div>
      </div>
    );
  }

  const { data: casesData } = await supabase.rpc("api_list_my_tax_cases_v2");
  return (
    <MyTaxesClient
      email={data.user.email}
      taxCases={parseMyTaxCases(casesData)}
    />
  );
}
