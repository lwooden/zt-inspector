import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-accent bg-accent text-accent-foreground hover:bg-[#0d6a63] focus-visible:outline-accent",
  secondary:
    "border-border bg-surface text-foreground hover:bg-background focus-visible:outline-accent",
};

type CommonProps = {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: never;
  };

type ButtonAsLink = CommonProps & {
  href: string;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function classes(variant: ButtonVariant, className?: string) {
  return [
    "inline-flex items-center justify-center gap-2 border px-4 py-2 text-sm font-medium transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button(props: ButtonProps) {
  if (typeof props.href === "string") {
    const { href, variant = "primary", className, children } = props;
    return (
      <Link href={href} className={classes(variant, className)}>
        {children}
      </Link>
    );
  }

  const { variant = "primary", className, children, type = "button", ...rest } =
    props;

  return (
    <button type={type} className={classes(variant, className)} {...rest}>
      {children}
    </button>
  );
}
