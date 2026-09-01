import { Sidebar } from "./sidebar";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import { ScrollToTop } from "./scroll-to-top";
import { OfflineIndicator } from "./offline-indicator";
import { UpdateBanner } from "./update-banner";
import { InstallPrompt } from "./install-prompt";
import { LocalDataIndicator } from "./local-data-indicator";
import { StorageWarning } from "./storage-warning";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:flex">
      <ScrollToTop />
      <div className="hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0">
        <Sidebar />
      </div>
      <div className="lg:flex-1 lg:min-w-0">
        <AppHeader />
        <main className="pb-20 lg:pb-0">{children}</main>
        <LocalDataIndicator />
      </div>
      <BottomNav />
      <OfflineIndicator />
      <UpdateBanner />
      <InstallPrompt />
      <StorageWarning />
    </div>
  );
}
