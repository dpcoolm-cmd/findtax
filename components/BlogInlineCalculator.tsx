"use client";
import Link from "next/link";
import { trackSiteEvent } from "@/lib/site-track";
export function BlogInlineCalculator({slug,href,title,description,calculatorType}:{slug:string;href:string;title:string;description:string;calculatorType:string}) {
  return <aside className="mt-5 rounded-lg border border-line-strong bg-surface-muted p-5" aria-label="내 조건으로 확인하기"><p className="font-bold">{title}</p><p className="mt-2 text-sm leading-7 text-ink-muted">{description}</p><Link href={href} className="btn-primary mt-4 inline-flex min-h-12" onClick={()=>trackSiteEvent("blog_cta_click",{blog_slug:slug,target:"calculator",calculator_type:calculatorType,destination:href,placement:"article_example",path:window.location.pathname})}>내 조건 입력하러 가기 →</Link></aside>;
}
