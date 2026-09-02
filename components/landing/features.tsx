"use client";

import {
  Activity,
  Apple,
  BarChart3,
  Clock,
  Droplets,
  Heart,
  Shield,
  WifiOff,
} from "lucide-react";
import {
  StaggerChildren,
  StaggerItem,
} from "@/components/motion/stagger";
import { FadeIn } from "@/components/motion/fade-in";

const features = [
  {
    icon: Droplets,
    title: "Glicemia",
    description: "Registre medições e acompanhe sua evolução ao longo do tempo.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Apple,
    title: "Alimentação",
    description:
      "Registre refeições e informações nutricionais como carboidratos.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: Activity,
    title: "Atividade física",
    description: "Registre exercícios, duração e intensidade.",
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    icon: Heart,
    title: "Medicamentos",
    description:
      "Mantenha histórico de medicamentos, doses e observações.",
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    icon: Clock,
    title: "Timeline",
    description:
      "Visualize seus acontecimentos do dia em ordem cronológica.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: BarChart3,
    title: "Estatísticas",
    description:
      "Visualize gráficos e indicadores da sua rotina de saúde.",
    color: "text-chart-5",
    bg: "bg-chart-5/10",
  },
  {
    icon: WifiOff,
    title: "Offline",
    description:
      "Continue utilizando a aplicação mesmo sem conexão com a internet.",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
  {
    icon: Shield,
    title: "Privacidade",
    description:
      "Seus dados ficam armazenados localmente no seu dispositivo.",
    color: "text-success",
    bg: "bg-success/10",
  },
];

export function Features() {
  return (
    <section id="funcionalidades" className="bg-surface-lowest px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tudo que você precisa
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Registre, acompanhe e entenda sua rotina de saúde com
            ferramentas simples e acessíveis.
          </p>
        </FadeIn>

        <StaggerChildren
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          staggerDelay={0.08}
        >
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elevated)]">
                <div
                  className={`mb-3 inline-flex size-10 items-center justify-center rounded-xl ${feature.bg}`}
                >
                  <feature.icon className={`size-5 ${feature.color}`} />
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
