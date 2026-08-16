"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, ShieldCheck, Upload } from "lucide-react";
import Papa from "papaparse";

export type SellerCsvSummary = {
  fileName: string;
  rowCount: number;
  detected: {
    order: string | null;
    amount: string | null;
    fee: string | null;
    refund: string | null;
    currency: string | null;
  };
  grossAmount: number | null;
  feeAmount: number | null;
  refundAmount: number | null;
  currencyCount: number;
};

const COLUMN_PATTERNS = {
  order: ["order", "주문", "거래번호", "transaction"],
  amount: ["gross", "sales", "amount", "결제금액", "판매금액", "총매출", "매출"],
  fee: ["fee", "commission", "수수료"],
  refund: ["refund", "cancel", "반품", "환불", "취소"],
  currency: ["currency", "통화", "화폐"],
} as const;

function findColumn(
  headers: string[],
  patterns: readonly string[],
): string | null {
  return (
    headers.find((header) => {
      const normalized = header.toLowerCase().replace(/\s/g, "");
      return patterns.some((pattern) =>
        normalized.includes(pattern.toLowerCase().replace(/\s/g, "")),
      );
    }) ?? null
  );
}

function numberFromCell(value: unknown): number {
  if (typeof value !== "string" && typeof value !== "number") return 0;
  const normalized = String(value)
    .replace(/[₩$€£¥,\s]/g, "")
    .replace(/[()]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
}

export function SellerSettlementCsvAnalyzer({
  onAnalyzed,
}: {
  onAnalyzed: (summary: SellerCsvSummary) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<SellerCsvSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const analyze = (file: File) => {
    setError(null);
    if (file.size > 1_000_000) {
      setError("1MB 이하 CSV만 분석할 수 있습니다.");
      return;
    }
    setBusy(true);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: (result) => {
        setBusy(false);
        if (result.errors.length > 0 && result.data.length === 0) {
          setError("CSV 열을 읽지 못했습니다. 첫 줄에 열 이름이 있는지 확인해 주세요.");
          return;
        }
        if (result.data.length > 50_000) {
          setError("5만 행 이하 정산자료만 분석할 수 있습니다.");
          return;
        }
        const headers = result.meta.fields ?? [];
        const detected = {
          order: findColumn(headers, COLUMN_PATTERNS.order),
          amount: findColumn(headers, COLUMN_PATTERNS.amount),
          fee: findColumn(headers, COLUMN_PATTERNS.fee),
          refund: findColumn(headers, COLUMN_PATTERNS.refund),
          currency: findColumn(headers, COLUMN_PATTERNS.currency),
        };
        const sum = (column: string | null) =>
          column
            ? result.data.reduce(
                (total, row) => total + numberFromCell(row[column]),
                0,
              )
            : null;
        const currencies = new Set(
          detected.currency
            ? result.data
                .map((row) => row[detected.currency!]?.trim().toUpperCase())
                .filter(Boolean)
            : [],
        );
        const next: SellerCsvSummary = {
          fileName: file.name,
          rowCount: result.data.length,
          detected,
          grossAmount: sum(detected.amount),
          feeAmount: sum(detected.fee),
          refundAmount: sum(detected.refund),
          currencyCount: Math.max(1, currencies.size),
        };
        setSummary(next);
        onAnalyzed(next);
      },
      error: () => {
        setBusy(false);
        setError("파일을 읽지 못했습니다. CSV 형식을 확인해 주세요.");
      },
    });
  };

  return (
    <section className="rounded-lg border border-line bg-surface-muted p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-ink">
            <FileSpreadsheet size={17} />
            플랫폼 정산 CSV 빠른 점검
          </p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            주문 수와 매출·수수료·환불·통화 열을 자동으로 찾아봅니다.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) analyze(file);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn-secondary shrink-0 text-sm font-bold disabled:opacity-60"
        >
          <Upload size={16} />
          {busy ? "분석 중..." : "CSV 선택"}
        </button>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#296B2F]">
        <ShieldCheck size={14} />
        원본 파일과 주문정보는 서버로 전송하지 않고 이 브라우저에서만 읽습니다.
      </p>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {summary ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-ink-muted">거래 행</p>
            <p className="mt-1 text-lg font-black text-ink">
              {summary.rowCount.toLocaleString("ko-KR")}건
            </p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-ink-muted">감지한 총매출</p>
            <p className="mt-1 text-lg font-black text-ink">
              {summary.grossAmount === null
                ? "열 미감지"
                : summary.grossAmount.toLocaleString("ko-KR")}
            </p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-ink-muted">수수료·환불 열</p>
            <p className="mt-1 text-sm font-black text-ink">
              {summary.detected.fee ? "수수료 있음" : "수수료 미감지"} ·{" "}
              {summary.detected.refund ? "환불 있음" : "환불 미감지"}
            </p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-ink-muted">정산 통화</p>
            <p className="mt-1 text-lg font-black text-ink">
              {summary.currencyCount}개
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
