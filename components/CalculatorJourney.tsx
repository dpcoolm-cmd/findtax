"use client";
import { useEffect, useRef, type ReactNode } from 'react';
import { trackSiteEvent } from '@/lib/site-track';

// Deliberately send only the calculator identity, never input or result values.
export function CalculatorJourney({ slug, children }: { slug: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const viewed = useRef(false);
  useEffect(() => {
    if (!viewed.current) {
      viewed.current = true;
      trackSiteEvent('calculator_view', { calculatorType: slug, calculator_type: slug });
    }
    if (!root.current) return;
    let recorded = false;
    const visibility = new IntersectionObserver(entries => {
      if (!recorded && started.current && entries.some(entry => entry.isIntersecting)) {
        recorded = true;
        trackSiteEvent('calculator_result_visible', { calculatorType: slug, calculator_type: slug });
        visibility.disconnect();
      }
    }, { threshold: 0.1 });
    const scan = () => {
      if (recorded) return;
      visibility.disconnect();
      root.current?.querySelectorAll('[data-calculator-result]').forEach(element => visibility.observe(element));
    };
    scan();
    const changes = new MutationObserver(scan);
    changes.observe(root.current, { childList: true, subtree: true });
    return () => { changes.disconnect(); visibility.disconnect(); };
  }, [slug]);
  return <div ref={root} onChangeCapture={() => {
    if (started.current) return;
    started.current = true;
    trackSiteEvent('calculator_start', { calculatorType: slug, calculator_type: slug });
  }}>{children}</div>;
}
