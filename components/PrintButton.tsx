"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-secondary text-sm font-bold"
    >
      <Printer size={17} />
      인쇄·PDF 저장
    </button>
  );
}
