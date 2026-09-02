"use client";

import { Heart } from "lucide-react";
import Link from "next/link";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  }
}

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Heart className="size-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">DiaBem</span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex"
        >
          <button
            type="button"
            onClick={() => scrollToSection("funcionalidades")}
            className="transition-colors hover:text-foreground"
          >
            Funcionalidades
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("privacidade")}
            className="transition-colors hover:text-foreground"
          >
            Privacidade
          </button>
          <Link
            href="/login"
            className="cursor-pointer transition-colors hover:text-foreground"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
