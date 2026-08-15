"use client";

import AuthGuard from "@/components/AuthGuard";
import WorldNav from "@/components/WorldNav";

export default function ProtectedShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex flex-1 flex-col">
        <WorldNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
