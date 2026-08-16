"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export interface LeadModalDefaults {
  targetAccountantId?: string | null;
  sido?: string;
  sigungu?: string;
  defaultSituation?: string;
  defaultMessage?: string;
}

type LeadExperienceContextValue = {
  isOpen: boolean;
  open: (defaults?: LeadModalDefaults) => void;
  close: () => void;
  defaults: LeadModalDefaults;
  toast: { message: string; tone: "success" | "error" } | null;
  showToast: (message: string, tone?: "success" | "error") => void;
  clearToast: () => void;
};

const LeadExperienceContext = createContext<LeadExperienceContextValue | null>(
  null,
);

export function LeadExperienceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaults, setDefaults] = useState<LeadModalDefaults>({});
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  const open = useCallback((d?: LeadModalDefaults) => {
    setDefaults(d ?? {});
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const showToast = useCallback(
    (message: string, tone: "success" | "error" = "success") => {
      setToast({ message, tone });
    },
    [],
  );

  const clearToast = useCallback(() => setToast(null), []);

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      defaults,
      toast,
      showToast,
      clearToast,
    }),
    [isOpen, open, close, defaults, toast, showToast, clearToast],
  );

  return (
    <LeadExperienceContext.Provider value={value}>
      {children}
    </LeadExperienceContext.Provider>
  );
}

export function useLeadExperience() {
  const ctx = useContext(LeadExperienceContext);
  if (!ctx) {
    throw new Error("useLeadExperience must be used within LeadExperienceProvider");
  }
  return ctx;
}
