# FindTax pension and financial decisions: Phase 1

## Audit before implementation

- Next.js 15 / React 19, App Router, TypeScript strict; installed versions are in package-lock.json. No framework upgrade is needed.
- Shared app/layout.tsx, Header, Footer and CalculatorDirectory already define the visual system. Preserve their neutral surfaces, brown and green accents and existing URLs.
- Thirteen existing calculators use lib/seo/calculators.ts. Twelve are dynamic slug routes, bookkeeping has its own route. Do not add a financial slug to the exhaustive tax-only union.
- Tax calculation functions live in lib/calculators; existing client tools combine optional saved cases with consultation CTAs. A financial cashflow simulation needs its own route without the global tax consultation section.
- Fifty-one static blog posts remain registered, including the remote 18 additions. Relevant pension guides already exist. No duplicate articles are required for Phase 1.
- Supabase and Resend are present. Saved tax cases and customer authentication already exist. Phase 1 does not change their schema or authentication.
- Existing /api/result-email stores an email together with the result summary in tracking_events. Do NOT reuse this endpoint for financial asset reports without separate consent, retention and storage design.
- Existing site-track sends GA allowlisted parameters and first-party events to /api/track. New financial events contain tool identifiers only, not financial inputs/results.
- Existing sitemap remediation verified live: 84 URLs, 51 articles, zero regional detail entries, article modified dates match. Home has no display ads. This is not an AdSense approval or an indexing guarantee.
- Existing terms/privacy are general-purpose. Public operator identity and full legal review remain outstanding; no invented qualifications or claims are added.
- Phase 1 adds no email collection, database storage or share URLs containing inputs. Calculations remain in React memory and disappear on reload. Analytics still measure page/activity events.
- Mobile navigation may exceed viewport height as calculators grow: keep menus scrollable. Verify 360/390/430px layouts and desktop after implementation.
- Baseline from previous release: 38 tests, types, lint and build passed. New implementation needs fresh checks.

## Changes

1. Keep the business/seller hero; add a small retirement entry and fourth situation option.
2. Reuse the single calculator list with five category filters. Existing 13 links remain; pension/finance contains existing IRP and new retirement-income tool.
3. Add /calculator/retirement-income as a static route, metadata/canonical/OpenGraph/Twitter/WebApplication/BreadcrumbList and sitemap entry.
4. Pure monthly model includes accumulation, optional additional contributions, pension start age, inflation, fixed other income, first unmet withdrawal and discounted additional retirement capital.
5. Results include readable asset bars, real-value labels, 2/4/6-percent illustrative scenarios, no-inflation comparison and detailed cashflows. No stock/product recommendations.
6. Link two existing pension guides in both directions. No unrelated consultation CTA on new result.
7. Events: calculator_view, calculator_start, calculator_complete, calculator_pdf_click, related_calculator_click. GA supports calculatorType and calculator_type; existing page tracker supplies session attribution. End-to-end GA receipt is a separate operational check.

## Calculation conventions

- Annual return is effective; monthly growth = (1 + annualReturn/100)^(1/12).
- Current assets + additional current assets grow monthly; fixed nominal monthly contributions occur at month-end until retirement.
- Spending and pension inputs are in today's purchasing power; both grow with assumed inflation. Pension begins only at entered pensionStartAge.
- Other monthly income is a fixed nominal amount from retirement. Surpluses are not invested.
- Retirement withdrawals occur at the beginning of the month, then the remaining balance earns the monthly return. First shortfall is not an exact depletion date.
- Required initial retirement capital is backward-discounted monthly shortfall; additional required capital subtracts projected retirement assets.
- Target age is the end boundary, not an extra full year. Equal current/retirement ages mean already retired. Earlier retirement ages are rejected.
- Taxes, withdrawal restrictions, investment volatility/sequence risk, health insurance, one-off expenses and individual entitlement are not computed.
- Reference checked 2026-09-06: specific NPS pension commencement and pension-system pages in RETIREMENT_REFERENCE. No implication that NPS certifies the model.

## Remaining phases (not completed by Phase 1)

- Phase 2: DB/DC and break-even solver, ISA net-tax comparison, retirement lump sum/pension after-tax comparison. Verify enacted law and company-plan limits before coding.
- Phase 2: privacy-safe sharing; proper print report; separate optional email consent/delivery/storage model. Existing print action is browser printing, not email delivery or server PDF.
- Phase 3: child long-term purchasing-power model, ETF total-return model, optional dashboard and saved results.
- AdSense: factual audit of remaining 49 articles, operator identity and privacy details, then deliberate review resubmission. Do not mistake more calculators for approval readiness.
