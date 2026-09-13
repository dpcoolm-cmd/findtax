import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AppShell } from "@/components/AppShell";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getBaseUrl, siteDescription, siteName } from "@/lib/seo/site";
import "./globals.css";

const baseUrl = getBaseUrl();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E8EBE6" },
    { media: "(prefers-color-scheme: dark)", color: "#E8EBE6" },
  ],
};

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const googleTagId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ?? "G-PG94DFHSY0";
const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const adsenseAccount = adsenseClient ?? "ca-pub-8715120205322652";
const ogImage = process.env.NEXT_PUBLIC_OG_IMAGE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "FindTax | 세금 계산부터 세무사 연결까지",
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: ["세무사", "세무사 찾기", "지역 세무사", "세무 상담"],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: "business",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: baseUrl,
    siteName,
    title: `${siteName} 찾기`,
    description: siteDescription,
    ...(ogImage ? { images: [{ url: ogImage, alt: siteName }] } : {}),
  },
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    other: {
      "naver-site-verification": "482df90ab22d80ffab80cbcac33a281c06d36fba",
      "google-adsense-account": adsenseAccount,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: siteName,
      description: siteDescription,
      inLanguage: "ko-KR",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="google-adsense-account" content={adsenseAccount} />
        <meta
          name="naver-site-verification"
          content="482df90ab22d80ffab80cbcac33a281c06d36fba"
        />
      </head>
      <body className="min-h-dvh touch-manipulation bg-bg font-sans font-medium text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {googleTagId ? (
          <>
            <Script
              id="google-tag-manager"
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
              strategy="afterInteractive"
            />
            <Script
              id="google-tag-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${googleTagId}', { send_page_view: false });
                `,
              }}
            />
          </>
        ) : null}
        <Script
          id="udeuk-track-loader"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try { if (localStorage.getItem('_ft_internal') === '1') return; } catch (_) {}
  var ua = navigator.userAgent.toLowerCase();
  var isBot = /googlebot|adsbot-google|bingbot|applebot|yeti|naverbot|daumoa|yandexbot|baiduspider|duckduckbot|headlesschrome|crawler|spider|semrush|ahrefsbot|slurp|bot\\.html|compatible;\\s*[a-z0-9_-]*bot/.test(ua) || navigator.webdriver === true;
  if (isBot) return;
  var s = document.createElement('script');
  s.id = 'udeuk-track';
  s.async = true;
  s.src = 'https://udeukdashboard.vercel.app/api/tracker.js?site=findtax';
  document.body.appendChild(s);
})();
            `,
          }}
        />
        <AppShell>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:p-4 focus:text-ink">본문 바로가기</a>
          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1 pt-[104px]">
            {children}
          </main>
          <Footer />
        </AppShell>
      </body>
    </html>
  );
}
