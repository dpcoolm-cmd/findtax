import Link from 'next/link';
import { BLOG_ARTICLES } from '@/lib/blog/posts';
import { CALCULATOR_GUIDES } from '@/lib/seo/calculator-guides';
import { CALCULATOR_DIRECTORY, calculatorGroup } from '@/lib/seo/calculators';

export function CalculatorSearchGuide({ slug }: { slug: string }) {
  const guide = CALCULATOR_GUIDES[slug];
  if (!guide) return null;
  const current = CALCULATOR_DIRECTORY.find(item => decodeURIComponent(item.href).endsWith(`/${slug}`));
  const related = current ? CALCULATOR_DIRECTORY.filter(item => item.key !== current.key && calculatorGroup(item) === calculatorGroup(current)).slice(0, 3) : [];
  const articles = BLOG_ARTICLES.map(article => ({ article, score: guide.terms.reduce((score, term) => score + (article.h1.includes(term) ? 2 : 0) + (article.keywords.some(keyword => keyword.includes(term)) ? 1 : 0), 0) })).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  return <section id="calculator-guide" className="scroll-mt-24 space-y-6 rounded-xl border border-line bg-white p-5 sm:p-7" aria-label="계산기 사용 안내">
    <h2 className="text-2xl font-bold">{current?.shortTitle} 계산 전 준비할 정보</h2>
    <p className="leading-7 text-ink-muted">{guide.prepare}</p>
    <h3 className="text-lg font-bold">입력부터 결과 확인까지</h3>
    <ol className="list-decimal space-y-2 pl-5 text-sm leading-7">{guide.steps.map(step => <li key={step}>{step}</li>)}</ol>
    <p className="border-l-2 border-primary pl-4 text-sm leading-7 text-ink-muted">{guide.limit}</p>
    {articles.length > 0 && <div><h3 className="font-bold">결과를 이해하는 세금 가이드</h3><ul className="mt-3 space-y-3">{articles.map(({ article }) => <li key={article.slug}><Link className="text-sm font-semibold underline underline-offset-4" href={`/blog/${article.slug}`}>{article.h1}</Link></li>)}</ul></div>}
    {related.length > 0 && <nav aria-label="관련 계산기" className="flex flex-wrap gap-3">{related.map(item => <Link key={item.key} href={item.href} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-bg-muted">{item.title}</Link>)}</nav>}
  </section>;
}
