"use client";

import { useState } from "react";
import { useLeadExperience } from "@/components/lead-experience-context";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

const SUPPORT_TYPES = [
  { value: "bug", label: "버그/오류" },
  { value: "calculation", label: "계산 결과 이상" },
  { value: "login", label: "로그인/회원가입 문제" },
  { value: "feature", label: "기능 제안" },
  { value: "other", label: "기타 불편" },
] as const;

const DEVICE_TYPES = [
  { value: "", label: "선택 안 함" },
  { value: "pc", label: "PC" },
  { value: "iphone", label: "아이폰" },
  { value: "android", label: "안드로이드" },
  { value: "tablet", label: "태블릿" },
] as const;

export function SupportRequestForm() {
  const { showToast } = useLeadExperience();
  const [type, setType] = useState<(typeof SUPPORT_TYPES)[number]["value"]>("bug");
  const [email, setEmail] = useState("");
  const [device, setDevice] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setDone(false);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          email: email.trim(),
          device,
          pageUrl: pageUrl.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        const msg =
          data.error === "missing_fields"
            ? "문의 항목을 모두 입력해 주세요."
            : data.error === "invalid_email"
              ? "이메일 형식을 확인해 주세요."
              : data.error === "message_too_short"
                ? "제목과 내용을 조금 더 구체적으로 적어 주세요."
                : "문의 접수 중 문제가 생겼습니다.";
        showToast(msg, "error");
        return;
      }
      setDone(true);
      setSubject("");
      setMessage("");
      setPageUrl("");
      showToast("서비스 문의가 접수되었습니다. 영업일 기준 1~2일 내 확인하겠습니다.", "success");
    } catch {
      showToast("문의 접수 중 네트워크 오류가 발생했습니다.", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-neutral-800">
          문의 유형
          <select
            className="mt-1 h-12 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-brand"
            value={type}
            onChange={(e) => setType(e.target.value as (typeof SUPPORT_TYPES)[number]["value"])}
            disabled={pending}
          >
            {SUPPORT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-neutral-800">
          회신 이메일
          <input
            type="email"
            className="mt-1 h-12 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-brand"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            disabled={pending}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-neutral-800">
          사용 기기
          <select
            className="mt-1 h-12 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-brand"
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            disabled={pending}
          >
            {DEVICE_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-neutral-800">
          문제 페이지 URL
          <input
            className="mt-1 h-12 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-brand"
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            placeholder="예: https://findtax.kr/calculator/양도세"
            disabled={pending}
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-neutral-800">
        제목
        <input
          className="mt-1 h-12 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-brand"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="예: 양도세 계산기에서 버튼이 눌리지 않아요"
          disabled={pending}
        />
      </label>

      <label className="block text-sm font-medium text-neutral-800">
        상세 내용
        <textarea
          className="mt-1 min-h-40 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-base outline-none focus:border-brand"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="어떤 화면에서, 무엇을 눌렀을 때, 어떤 문제가 있었는지 적어 주세요."
          disabled={pending}
        />
      </label>

      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm leading-relaxed text-neutral-600">
        세무 해석이나 절세 상담은 이 페이지보다 <strong className="font-semibold text-neutral-800">상담 신청</strong>으로
        남겨 주시는 편이 더 빠릅니다. 이 페이지는 로그인, 오류, 계산기 불편, 기능 제안 같은 서비스 운영 문의용입니다.
      </div>

      {done ? (
        <div className="rounded-2xl border border-[#d8e2d2] bg-[#f6faf2] px-4 py-4 text-sm leading-relaxed text-[#2f5130]">
          문의가 정상 접수되었습니다. 영업일 기준 1~2일 내 확인 후 입력하신 이메일로 답변드리겠습니다.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton type="submit" className="min-w-[180px]">
          {pending ? "접수 중..." : "서비스 문의 접수하기"}
        </PrimaryButton>
        <p className="text-sm text-neutral-500">
          스크린샷은 지금은 링크나 설명으로 남겨 주세요. 첨부 업로드는 다음 단계에서 붙일 수 있어요.
        </p>
      </div>
    </form>
  );
}
