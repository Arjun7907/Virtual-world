"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useVirtualWorldStore } from "@/lib/store";

const noopSubscribe = () => () => {};

// The persisted store only reflects localStorage after the client mounts;
// this reads true on the client and false during SSR without a state/effect pair.
function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useVirtualWorldStore((s) => s.user);
  const mounted = useMounted();
  const router = useRouter();

  useEffect(() => {
    if (mounted && !user) {
      router.replace("/login");
    }
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-slate-400">
        Loading your virtual world…
      </div>
    );
  }

  return <>{children}</>;
}
