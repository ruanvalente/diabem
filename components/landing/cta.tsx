"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/motion/fade-in";

export function CTA() {
  return (
    <section className="bg-background px-5 py-16 sm:px-8 sm:py-24">
      <FadeIn className="mx-auto max-w-3xl text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Comece a cuidar da sua saúde hoje
        </h2>
        <p className="mb-8 text-lg text-muted-foreground">
          Organize sua rotina, acompanhe seus dados e tenha mais clareza
          sobre sua saúde.
        </p>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ size: "lg" }),
            "px-10 text-base"
          )}
        >
          Começar meu acompanhamento
        </Link>
      </FadeIn>
    </section>
  );
}
