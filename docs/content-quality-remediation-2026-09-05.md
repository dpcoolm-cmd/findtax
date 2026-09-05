# FindTax quality remediation

## Scope of this release

- Preserve existing calculator logic, consultation APIs and article URLs.
- Remove global Coupang rendering, AdSense display script and ad slots. Retain ownership metadata and ads.txt. This is a reader-experience policy for all visitors, not a crawler-specific review mode.
- Remove automatic article-length padding. Existing topic-specific supplements remain and need individual review.
- Replace the oversized home onboarding section with two substantive starter guides before the single calculator directory.
- Add article contents navigation, accessible tables, checklists, modification dates, revision notes and clearer source links.
- Improve the existing VAT decision and freelancer withholding articles, without creating duplicate URLs.
- Publish the previously prepared sitemap and region/register indexing changes. Noindex controls search indexing, not AdSense review eligibility.

## Content work completed

| Existing URL | Substantive change | Source verification |
| --- | --- | --- |
| /blog/부가세-신고-세무사-직접-판단 | Distinguish filing periods, direct filing vs review vs delegation, hypothetical settlement reconciliation, quote scope and document checklist | NTS VAT overview and filing deadlines checked 2026-09-05 |
| /blog/프리랜서-3점3-종합소득세-환급-추가납부 | Hypothetical national-tax comparison, separate local tax, gross receipts vs net deposits, payment-record checklist | NTS prefilled refund guidance checked 2026-09-05 |

These are source-backed editorial improvements, not a professional tax certification or an audit of all 33 published articles.

## Remaining work, in order

1. Confirm public operator/business name, contact channel and actual professional-review arrangements with the owner. Reconcile the about page, privacy policy and terms with the actual service. Do not invent credentials or publish a provisional identity.
2. Review the remaining 31 articles individually. Prioritize proposed-versus-enacted law claims, expired deadlines, broad homepage-only sources and unsupported numerical examples. Repair the same URL when the intent is useful; consolidate only genuinely overlapping articles with appropriate redirects.
3. Audit calculator explanations and results: assumptions, applicable tax year, exclusions, official source and next action. Passing regression tests does not establish legal accuracy.
4. Verify consultation and support delivery using an explicitly identified test workflow, without creating unsolicited real leads. Review directory data freshness and avoid implying verified expert partnerships where none exist.
5. Review mobile navigation, output readability, broken internal links, published metadata and sitemap again after each release.
6. Request AdSense review only after the material content and trust gaps are resolved. No minimum word count, article count, indexed-URL count or waiting period is treated as an official approval guarantee.
7. Then consider a tightly scoped retirement/ETF section centered on after-tax account comparisons. Do not build a generic investment recommendation portal while the current content audit is incomplete.

## Release checks

Run `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`.
After deployment verify the root, both revised guides, calculator, consultation, policies, ads.txt, robots.txt and sitemap on findtax.kr. Check rendered article tables and contents links, not only source code.

## Primary references

- https://support.google.com/adsense/answer/7299563
- https://support.google.com/adsense/answer/10502938
- https://developers.google.com/search/docs/crawling-indexing/block-indexing
- https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7693&mi=2272
- https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7694&mi=2273
- https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=239072&mi=41095
