"use client";

import { Database, Download, Lock, Trash2 } from "lucide-react";
import {
  StaggerChildren,
  StaggerItem,
} from "@/components/motion/stagger";
import { FadeIn } from "@/components/motion/fade-in";

const privacyItems = [
  {
    icon: Database,
    title: "Armazenamento local",
    description:
      "Seus dados ficam salvos no seu dispositivo. Nada é enviado para servidores externos sem seu consentimento.",
  },
  {
    icon: Download,
    title: "Controle sobre exportação",
    description:
      "Exporte seus dados quando quiser. Você decide o que compartilhar e com quem.",
  },
  {
    icon: Lock,
    title: "Proteção dos dados",
    description:
      "Seus dados são protegidos com bloqueio de aplicação e criptografia quando disponível.",
  },
  {
    icon: Trash2,
    title: "Apague quando quiser",
    description:
      "Delete todos os seus dados a qualquer momento. Nenhum dado é mantido sem sua permissão.",
  },
];

export function Privacy() {
  return (
    <section className="bg-surface-lowest px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Sua privacidade importa
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Seus dados de saúde são pessoais e sensíveis. Tratamos eles com o
            cuidado que merecem.
          </p>
        </FadeIn>

        <StaggerChildren
          className="grid gap-6 sm:grid-cols-2"
          staggerDelay={0.1}
        >
          {privacyItems.map((item) => (
            <StaggerItem key={item.title}>
              <div className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10">
                  <item.icon className="size-5 text-success" />
                </div>
                <div>
                  <h3 className="mb-1 text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
