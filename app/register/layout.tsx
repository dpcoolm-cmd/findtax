import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo/urls";

export const metadata: Metadata = {
  title: "세무사 파트너 입점",
  description:
    "findtax.kr 세무사 자가등록 및 STANDARD·PREMIUM 노출 플랜 안내. 무료 기본 등록부터 상담 연결까지.",
  alternates: { canonical: absoluteUrl("/register") },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
