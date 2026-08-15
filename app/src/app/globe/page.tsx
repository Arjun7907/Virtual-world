import { createClient } from "@/lib/supabase/server";
import GlobeView from "@/components/GlobeView";
import type { AvatarColor, VirtualWorldInit } from "@/lib/store";

export default async function GlobePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let identity: VirtualWorldInit | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_name, avatar_color")
      .eq("id", user.id)
      .single();

    identity = {
      user: { id: user.id, email: user.email ?? "" },
      avatarName: profile?.avatar_name ?? "Explorer",
      avatarColor: (profile?.avatar_color as AvatarColor) ?? "indigo",
    };
  }

  return <GlobeView identity={identity} />;
}
