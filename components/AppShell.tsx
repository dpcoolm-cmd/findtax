"use client";

import { LeadExperienceProvider } from "@/components/lead-experience-context";
import { LeadConversionUI } from "@/components/LeadConversionUI";
import { SitePageTracker } from "@/components/SitePageTracker";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LeadExperienceProvider>
      <>
        <SitePageTracker />
        <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bg text-ink">
          {children}
        </div>
        <LeadConversionUI />
      </>
    </LeadExperienceProvider>
  );
}
