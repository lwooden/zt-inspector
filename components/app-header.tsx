import Link from "next/link";
import { AppNav } from "@/components/app-nav";

export function AppHeader() {
  return (
    <header className="border-b border-border bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4 px-6 py-4">
        <div>
          <Link
            href="/"
            className="font-sans text-lg font-semibold tracking-tight text-foreground hover:text-accent"
          >
            ZT Inspector
          </Link>
          <p className="mt-0.5 text-sm text-muted">
            Centralized reporting for Zero Trust posture
          </p>
        </div>
        <AppNav />
      </div>
    </header>
  );
}
