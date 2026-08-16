"use client";

import { getSigunguBySido, SIDO_NAMES } from "@/lib/regions";

export function RegionSelector({
  sido,
  sigungu,
  onSidoChange,
  onSigunguChange,
  disabled,
}: {
  sido: string;
  sigungu: string;
  onSidoChange: (s: string) => void;
  onSigunguChange: (s: string) => void;
  disabled?: boolean;
}) {
  const districts = getSigunguBySido(sido);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm font-medium text-neutral-800">
        시·도
        <select
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-base shadow-sm outline-none ring-brand focus:ring-2 disabled:opacity-60"
          value={sido}
          disabled={disabled}
          onChange={(e) => {
            const next = e.target.value;
            onSidoChange(next);
            const nextList = getSigunguBySido(next);
            onSigunguChange(nextList[0] ?? "");
          }}
        >
          <option value="">선택</option>
          {SIDO_NAMES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-neutral-800">
        시·군·구
        <select
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-base shadow-sm outline-none ring-brand focus:ring-2 disabled:opacity-60"
          value={sigungu}
          disabled={disabled || !sido}
          onChange={(e) => onSigunguChange(e.target.value)}
        >
          <option value="">선택</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
