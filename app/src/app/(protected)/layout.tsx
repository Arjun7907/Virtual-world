import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoreProvider from "@/components/StoreProvider";
import WorldNav from "@/components/WorldNav";
import type { AvatarColor, InventoryItem, VirtualWorldInit, Venture, JobProgress } from "@/lib/store";
import type { VentureType } from "@/lib/ventures";
import type { JobId } from "@/lib/jobs";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: stats }, { data: inventoryRows }, { data: ventureRows }, { data: jobRows }] =
    await Promise.all([
    supabase.from("profiles").select("avatar_name, avatar_color, coins").eq("id", user.id).single(),
    supabase
      .from("game_stats")
      .select("tic_tac_toe_wins, memory_wins, recipes_cooked, jobs_worked")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("inventory_items")
      .select("item_id, name, emoji, category")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("ventures")
      .select("id, venture_type, level, last_collected_at")
      .eq("user_id", user.id),
    supabase.from("job_progress").select("job_id, shifts_completed").eq("user_id", user.id),
  ]);

  const inventory: InventoryItem[] = (inventoryRows ?? []).map((row) => ({
    id: row.item_id,
    name: row.name,
    emoji: row.emoji,
    category: row.category as InventoryItem["category"],
  }));

  const ventures: Venture[] = (ventureRows ?? []).map((row) => ({
    id: row.id,
    type: row.venture_type as VentureType,
    level: row.level,
    lastCollectedAt: row.last_collected_at,
  }));

  const jobProgress: JobProgress = { barista: 0, courier: 0, warehouse: 0 };
  (jobRows ?? []).forEach((row) => {
    jobProgress[row.job_id as JobId] = row.shifts_completed;
  });

  const init: VirtualWorldInit = {
    user: { id: user.id, email: user.email ?? "" },
    avatarName: profile?.avatar_name ?? "Explorer",
    avatarColor: (profile?.avatar_color as AvatarColor) ?? "indigo",
    coins: profile?.coins ?? 0,
    inventory,
    stats: {
      ticTacToeWins: stats?.tic_tac_toe_wins ?? 0,
      memoryWins: stats?.memory_wins ?? 0,
      recipesCooked: stats?.recipes_cooked ?? 0,
      jobsWorked: stats?.jobs_worked ?? 0,
    },
    ventures,
    jobProgress,
  };

  return (
    <StoreProvider init={init}>
      <div className="flex flex-1 flex-col">
        <WorldNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </StoreProvider>
  );
}
