"use client";

export function TrackedPhoneLink({
  href,
  className,
  children,
  accountantId,
  officeName,
  sido,
  sigungu,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  accountantId: string;
  officeName: string;
  sido: string;
  sigungu: string;
}) {
  function logClick() {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "phone_click",
        payload: {
          accountantId,
          officeName,
          sido,
          sigungu,
        },
      }),
    }).catch(() => {});
  }

  return (
    <a
      href={href}
      className={className}
      onClick={logClick}
      rel="nofollow"
    >
      {children}
    </a>
  );
}
