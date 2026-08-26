"use client";

import { BarChart3, ClipboardList, LineChart, Share2 } from "lucide-react";
import {
  StaggerChildren,
  StaggerItem,
} from "@/components/motion/stagger";
import { FadeIn } from "@/components/motion/fade-in";

const steps = [
  {
    step: "01",
    icon: ClipboardList,
    title: "Registre seus dados",
    description:
      "Adicione glicemia, refeições, atividades e medicamentos em poucos toques.",
  },
  {
    step: "02",
    icon: LineChart,
    title: "Acompanhe sua rotina",
    description:
      "Visualize sua timeline diária e entenda o que aconteceu ao longo do dia.",
  },
  {
    step: "03",
    icon: BarChart3,
    title: "Identifique padrões",
    description:
      "Veja gráficos e insights simples baseados nos seus registros.",
  },
  {
    step: "04",
    icon: Share2,
    title: "Exporte seus relatórios",
    description:
      "Gere relatórios e compartilhe com seus profissionais de saúde.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-background px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Como funciona
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Quatro passos simples para organizar sua rotina de saúde.
          </p>
        </FadeIn>

        <StaggerChildren
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          staggerDelay={0.12}
        >
          {steps.map((step) => (
            <StaggerItem key={step.step}>
              <div className="relative text-center">
                <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                  <step.icon className="size-6 text-primary" />
                </div>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
                  Passo {step.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
