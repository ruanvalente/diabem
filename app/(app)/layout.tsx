import { AppShell } from "@/components/layout/app-shell";
import { PageTransition } from "@/components/motion/page-transition";
import { AuthGuard } from "@/components/shared/auth-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>
        <PageTransition>{children}</PageTransition>
      </AppShell>
    </AuthGuard>
  );
}
