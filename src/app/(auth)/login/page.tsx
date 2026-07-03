"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/timer");
    }
  }, [loading, user, router]);

  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, #2a78d6, transparent 45%), radial-gradient(circle at 80% 75%, #4a3aa7, transparent 45%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">PMTT</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Product Manager Time Tracker — registro de tempo e evidência de trabalho
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
