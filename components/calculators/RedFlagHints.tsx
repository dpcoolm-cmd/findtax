"use client";

export type RedFlagHint = {
  id: string;
  message: string;
};

export function RedFlagHints({ hints }: { hints: RedFlagHint[] }) {
  if (hints.length === 0) return null;

  return (
    <div className="space-y-3">
      {hints.map((hint) => (
        <div
          key={hint.id}
          className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4"
        >
          <span
            className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F59E0B] text-xs font-semibold text-white"
            aria-hidden="true"
          >
            !
          </span>
          <p className="text-sm leading-relaxed text-neutral-700">{hint.message}</p>
        </div>
      ))}
    </div>
  );
}
