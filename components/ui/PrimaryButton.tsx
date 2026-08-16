import Link from "next/link";
import type { ReactNode } from "react";

type CommonProps = {
  children: ReactNode;
  className?: string;
};

export function PrimaryButton(
  props:
    | (CommonProps & { href: string; onClick?: never; type?: never })
    | (CommonProps & { href?: never; onClick?: () => void; type?: "button" | "submit" | "reset" }),
) {
  const classes =
    "inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-hover active:bg-primary-active focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40";

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={`${classes} ${props.className ?? ""}`}>
        {props.children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      className={`${classes} ${props.className ?? ""}`}
    >
      {props.children}
    </button>
  );
}
