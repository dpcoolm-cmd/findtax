"use client";

import { useMemo, useState } from "react";

export function DecisionSummaryCard({
  title = "공유 가능한 한 줄 결과",
  summary,
  description,
  onCopy,
  onLinkCopy,
}: {
  title?: string;
  summary: string;
  description?: string;
  onCopy?: () => void;
  onLinkCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareText = useMemo(() => {
    return description ? `${summary}\n\n${description}` : summary;
  }, [description, summary]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      onCopy?.();
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      onCopy?.();
    }
  };

  const handleLinkCopy = async () => {
    const href = typeof window !== "undefined" ? window.location.href : "";
    if (!href) return;

    try {
      await navigator.clipboard.writeText(href);
      setLinkCopied(true);
      onLinkCopy?.();
      window.setTimeout(() => setLinkCopied(false), 1600);
    } catch {
      onLinkCopy?.();
    }
  };

  return (
    <div className="rounded-lg border border-line bg-surface-muted px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="text-base font-semibold leading-relaxed text-neutral-900">{summary}</p>
          {description ? <p className="text-sm leading-relaxed text-neutral-600">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink-muted hover:bg-bg hover:text-ink"
        >
          {copied ? "복사됨" : "결과 문구 복사"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleLinkCopy}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink-muted hover:bg-bg hover:text-ink"
        >
          {linkCopied ? "복사됨" : "페이지 링크 복사"}
        </button>
      </div>
    </div>
  );
}
