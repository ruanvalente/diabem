import { Sidebar } from "./sidebar";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import { ScrollToTop } from "./scroll-to-top";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <ScrollToTop />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
