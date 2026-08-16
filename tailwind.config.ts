import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "375px",
      },
      fontFamily: {
        // Inter 우선, 한국어 fallback으로 Pretendard
        sans: ["Inter", "Pretendard Variable", "Pretendard", "-apple-system", "BlinkMacSystemFont", "Apple SD Gothic Neo", "Noto Sans KR", "system-ui", "sans-serif"],
        display: ["Inter", "Pretendard Variable", "Pretendard", "-apple-system", "BlinkMacSystemFont", "Apple SD Gothic Neo", "Noto Sans KR", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      spacing: {
        "safe-b": "env(safe-area-inset-bottom)",
        "safe-t": "env(safe-area-inset-top)",
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
      },
      colors: {
        // ── Wise Brand ────────────────────────────────────────────
        primary: {
          DEFAULT: "#3B2E25",
          hover: "#4D3C2F",
          active: "#2A211A",
        },
        brand: {
          DEFAULT: "#9FE870",   // primary (lime green CTA)
          light: "#CDFFAD",     // primary-active (hover)
          neutral: "#C5EDAB",   // primary-neutral
          accent: "#E2F6D5",    // primary-pale (soft tint)
          dark: "#3B2E25",      // primary brown
        },
        // ── Surfaces ──────────────────────────────────────────────
        bg: {
          DEFAULT: "#E8EBE6",   // canvas
          muted: "#F7FAF4",     // subtle surface
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F7FAF4",
          elevated: "#FFFFFF",
        },
        // ── Text ──────────────────────────────────────────────────
        ink: {
          DEFAULT: "#0E0F0C",   // near-black with olive warmth
          muted: "#454745",     // body / secondary text
          soft: "#868685",      // captions / placeholders
        },
        // ── Borders ───────────────────────────────────────────────
        line: {
          DEFAULT: "#D5D9D2",
          soft: "#E8EBE6",
          strong: "#C5EDAB",
        },
        // ── Semantic: Positive ────────────────────────────────────
        positive: {
          DEFAULT: "#2EAD4B",
          deep: "#054D28",
          pale: "#E2F6D5",
        },
        // ── Semantic: Warning ─────────────────────────────────────
        warning: {
          DEFAULT: "#FFD11A",
          deep: "#B86700",
          content: "#4A3B1C",
        },
        // ── Semantic: Negative ────────────────────────────────────
        negative: {
          DEFAULT: "#D03238",
          deep: "#A72027",
          darkest: "#A7000D",
          bg: "#320707",
        },
        // ── Accent Tertiary ───────────────────────────────────────
        accent: {
          orange: "#FFC091",
          cyan: "#38C8FF",
        },
      },
      borderRadius: {
        // Wise 스펙 정렬: xl = 24px (버튼·카드 canonical radius)
        sm: "8px",
        md: "8px",
        lg: "8px",
        xl: "8px",
        "2xl": "8px",
        "3xl": "8px",
        "4xl": "8px",
        pill: "9999px",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(14, 15, 12, 0.06)",
        card: "0 2px 10px rgba(14, 15, 12, 0.06)",
      },
      fontSize: {
        // Wise 타이포 스케일 (display 계열)
        "display-mega": ["126px", { lineHeight: "0.85", fontWeight: "900", letterSpacing: "-0.02em" }],
        "display-xxl":  ["96px",  { lineHeight: "0.85", fontWeight: "900", letterSpacing: "-0.02em" }],
        "display-xl":   ["64px",  { lineHeight: "0.85", fontWeight: "900", letterSpacing: "-0.02em" }],
        "display-lg":   ["47px",  { lineHeight: "1.5",  fontWeight: "400", letterSpacing: "-0.003em" }],
        "display-md":   ["40px",  { lineHeight: "0.85", fontWeight: "900", letterSpacing: "-0.01em" }],
        "display-sm":   ["32px",  { lineHeight: "1.2",  fontWeight: "600", letterSpacing: "-0.03em" }],
        "display-xs":   ["24px",  { lineHeight: "1.3",  fontWeight: "600", letterSpacing: "-0.02em" }],
      },
    },
  },
  plugins: [],
};

export default config;
