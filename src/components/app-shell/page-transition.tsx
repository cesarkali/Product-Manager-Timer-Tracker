"use client";

import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
      {children}
    </div>
  );
}
