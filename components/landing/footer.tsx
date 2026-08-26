import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-lowest px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <Heart className="size-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              DiaBem
            </span>
          </div>

          <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="cursor-pointer transition-colors hover:text-foreground">
              Sobre
            </span>
            <span className="cursor-pointer transition-colors hover:text-foreground">
              Privacidade
            </span>
            <span className="cursor-pointer transition-colors hover:text-foreground">
              Termos
            </span>
            <span className="cursor-pointer transition-colors hover:text-foreground">
              Contato
            </span>
          </nav>

          <div className="text-center text-xs text-muted-foreground sm:text-right">
            <p>v1.0.0</p>
            <p>Dados armazenados localmente</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
