"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ClipboardCheck, Copy, FileText } from "lucide-react";
import type { TaxCaseView } from "@/lib/tax-cases/server";
import {
  buildTaxCaseHandoffText,
  taxCaseConsultHref,
} from "@/lib/tax-cases/handoff";

export function TaxCaseHandoffPanel({ taxCase }: { taxCase: TaxCaseView }) {
  const [copied, setCopied] = useState(false);
  const text = buildTaxCaseHandoffText(taxCase);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="mt-8 rounded-lg border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-sm font-bold text-[#6A442D]">
            <ClipboardCheck size={18} />
            세무사 전달용 진단 인계서
          </p>
          <h2 className="mt-2 text-2xl font-black text-ink">
            같은 내용을 다시 설명하지 않아도 됩니다.
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            진단 결과, 남은 할 일과 준비자료를 한 장으로 정리했습니다. 상담을
            신청하면 이 요약이 함께 전달됩니다.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copy()}
            className="btn-secondary text-sm font-bold"
          >
            <Copy size={16} />
            {copied ? "복사됨" : "요약 복사"}
          </button>
          <Link
            href={`/case/${taxCase.token}/handoff`}
            className="btn-secondary text-sm font-bold"
          >
            <FileText size={16} />
            1장 보고서
          </Link>
        </div>
      </div>
      <div className="mt-5 max-h-52 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-muted p-4 text-xs leading-6 text-ink-muted">
        {text}
      </div>
      <Link
        href={taxCaseConsultHref(taxCase.token)}
        className="btn-primary mt-4 w-full text-sm font-bold sm:w-auto"
      >
        이 진단을 붙여 전문가에게 검토 요청
        <ArrowRight size={17} />
      </Link>
    </section>
  );
}
