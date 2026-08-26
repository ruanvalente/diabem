"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity,
  Apple,
  Droplets,
  Heart,
  Smartphone,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background px-5 py-16 sm:px-8 sm:py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent" />
      <div className="relative mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
          >
            <Smartphone className="size-4" />
            Funciona no celular e offline
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Seu companheiro pessoal de{" "}
            <span className="text-primary">saúde</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            Entenda melhor sua rotina. Acompanhe seus dados. Tenha mais
            informação para suas decisões.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-12 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg" }),
                "px-8 text-base"
              )}
            >
              Começar agora
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "px-8 text-base"
              )}
            >
              Entrar
            </Link>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="relative w-full max-w-2xl"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Boa noite, Ruan
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    Veja como foi seu acompanhamento hoje.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: "spring", stiffness: 300 }}
                    className="flex size-2 rounded-full bg-success"
                  />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    icon: <Droplets className="size-4 text-primary" />,
                    label: "Glicemia",
                    value: "112",
                    unit: "mg/dL",
                  },
                  {
                    icon: <Apple className="size-4 text-success" />,
                    label: "Refeições",
                    value: "3",
                    unit: "registros",
                  },
                  {
                    icon: <Activity className="size-4 text-warning" />,
                    label: "Atividade",
                    value: "30",
                    unit: "min",
                  },
                  {
                    icon: <Heart className="size-4 text-destructive" />,
                    label: "Medicamentos",
                    value: "2",
                    unit: "doses",
                  },
                ].map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="rounded-xl bg-background p-3 text-left"
                  >
                    <div className="mb-2 flex items-center gap-1.5">
                      {card.icon}
                      <span className="text-xs font-medium text-muted-foreground">
                        {card.label}
                      </span>
                    </div>
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                      {card.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{card.unit}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background px-4 py-1.5 text-xs text-muted-foreground shadow-md"
            >
              Seus dados, sempre com você
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
