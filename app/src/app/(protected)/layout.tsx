import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoreProvider from "@/components/StoreProvider";
import GlobePresence from "@/components/GlobePresence";
import type { AvatarColor, VirtualWorldInit } from "@/lib/store";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_name, avatar_color")
    .eq("id", user.id)
    .single();

  const init: VirtualWorldInit = {
    user: { id: user.id, email: user.email ?? "" },
    avatarName: profile?.avatar_name ?? "Explorer",
    avatarColor: (profile?.avatar_color as AvatarColor) ?? "indigo",
  };

  return (
    <StoreProvider init={init}>
      <GlobePresence />
      <div className="flex flex-1 flex-col">{children}</div>
    </StoreProvider>
  );
}
