import { AuthGate } from "@/components/auth/auth-gate";
import { Sidebar } from "@/components/app-shell/sidebar";
import { MobileNav } from "@/components/app-shell/mobile-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex min-h-full flex-1 bg-muted/20">
        <Sidebar />
        <div className="flex min-h-full flex-1 flex-col">
          <MobileNav />
          <main className="w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10 2xl:px-16">
            {children}
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
