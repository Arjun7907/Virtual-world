"use client";

import { createContext, useContext } from "react";
import { createStore, useStore } from "zustand";
import { createClient } from "@/lib/supabase/client";

export type AvatarColor = "indigo" | "rose" | "emerald" | "amber" | "sky" | "violet";

export interface InventoryItem {
  id: string;
  name: string;
  emoji: string;
  category: "shop" | "kitchen" | "arcade";
}

export interface AuthUser {
  id: string;
  email: string;
}

interface GameStats {
  ticTacToeWins: number;
  memoryWins: number;
  recipesCooked: number;
  jobsWorked: number;
}

const STAT_COLUMN: Record<keyof GameStats, string> = {
  ticTacToeWins: "tic_tac_toe_wins",
  memoryWins: "memory_wins",
  recipesCooked: "recipes_cooked",
  jobsWorked: "jobs_worked",
};

export interface VirtualWorldInit {
  user: AuthUser;
  avatarName: string;
  avatarColor: AvatarColor;
  coins: number;
  inventory: InventoryItem[];
  stats: GameStats;
}

interface VirtualWorldState extends VirtualWorldInit {
  setAvatarColor: (color: AvatarColor) => void;
  setAvatarName: (name: string) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addInventoryItem: (item: InventoryItem) => void;
  recordWin: (game: keyof GameStats) => void;
}

// Each request/session gets its own store instance (via StoreProvider) so
// server-fetched user data never leaks across requests through a shared
// module-level singleton.
export function createVirtualWorldStore(init: VirtualWorldInit) {
  return createStore<VirtualWorldState>()((set, get) => ({
    ...init,

    setAvatarColor: (avatarColor) => {
      set({ avatarColor });
      void createClient().from("profiles").update({ avatar_color: avatarColor }).eq("id", get().user.id);
    },

    setAvatarName: (avatarName) => {
      set({ avatarName });
      void createClient().from("profiles").update({ avatar_name: avatarName }).eq("id", get().user.id);
    },

    addCoins: (amount) => {
      const { user, coins } = get();
      const next = coins + amount;
      set({ coins: next });
      void createClient().from("profiles").update({ coins: next }).eq("id", user.id);
    },

    spendCoins: (amount) => {
      const { user, coins } = get();
      if (coins < amount) return false;
      const next = coins - amount;
      set({ coins: next });
      void createClient().from("profiles").update({ coins: next }).eq("id", user.id);
      return true;
    },

    addInventoryItem: (item) => {
      const { user } = get();
      set((state) => ({ inventory: [...state.inventory, item] }));
      void createClient()
        .from("inventory_items")
        .insert({
          user_id: user.id,
          item_id: item.id,
          name: item.name,
          emoji: item.emoji,
          category: item.category,
        });
    },

    recordWin: (game) => {
      const { user, stats } = get();
      const nextStats = { ...stats, [game]: stats[game] + 1 };
      set({ stats: nextStats });
      void createClient()
        .from("game_stats")
        .update({ [STAT_COLUMN[game]]: nextStats[game] })
        .eq("user_id", user.id);
    },
  }));
}

export type VirtualWorldStore = ReturnType<typeof createVirtualWorldStore>;

export const VirtualWorldStoreContext = createContext<VirtualWorldStore | null>(null);

export function useVirtualWorldStore<T>(selector: (state: VirtualWorldState) => T): T {
  const store = useContext(VirtualWorldStoreContext);
  if (!store) {
    throw new Error("useVirtualWorldStore must be used within a StoreProvider");
  }
  return useStore(store, selector);
}
