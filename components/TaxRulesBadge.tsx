import { TAX_RULES_LAST_VERIFIED } from "@/config/tax-display";

export { TAX_RULES_LAST_VERIFIED };

export function TaxRulesBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 ${className}`}
    >
      계산 기준 점검월 {TAX_RULES_LAST_VERIFIED}
    </span>
  );
}
