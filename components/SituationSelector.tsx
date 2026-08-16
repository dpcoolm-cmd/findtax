"use client";

import { TAX_SITUATIONS } from "@/lib/situations";

export function SituationSelector({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-medium text-neutral-800">상황</legend>
      <div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-neutral-200 bg-brand-light/40 p-2 sm:max-h-none sm:grid-cols-2">
        {TAX_SITUATIONS.map((s) => (
          <label
            key={s.id}
            className={`flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-sm ${
              value === s.id ? "bg-white shadow-sm ring-2 ring-brand" : "bg-white/60"
            }`}
          >
            <input
              type="radio"
              name="situation"
              value={s.id}
              checked={value === s.id}
              onChange={() => onChange(s.id)}
              className="mt-0.5 h-4 w-4 shrink-0 border-neutral-300 text-brand focus:ring-brand"
            />
            <span className="min-w-0">
              <span className="block font-medium leading-snug">{s.label}</span>
              {s.subtitle ? (
                <span className="mt-0.5 block text-xs font-normal text-neutral-600">
                  {s.subtitle}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
