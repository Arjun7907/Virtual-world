"use client";

import { createContext, useContext } from "react";
import { createStore, useStore } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { VENTURE_TEMPLATES, accruedCoins, ventureUpgradeCost, type VentureType } from "@/lib/ventures";

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

export interface Venture {
  id: number;
  type: VentureType;
  level: number;
  lastCollectedAt: string;
}

export interface VirtualWorldInit {
  user: AuthUser;
  avatarName: string;
  avatarColor: AvatarColor;
  coins: number;
  inventory: InventoryItem[];
  stats: GameStats;
  ventures: Venture[];
}

interface VirtualWorldState extends VirtualWorldInit {
  setAvatarColor: (color: AvatarColor) => void;
  setAvatarName: (name: string) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addInventoryItem: (item: InventoryItem) => void;
  recordWin: (game: keyof GameStats) => void;
  buyVenture: (type: VentureType) => Promise<boolean>;
  collectVenture: (id: number) => void;
  upgradeVenture: (id: number) => boolean;
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

    buyVenture: async (type) => {
      const { user, ventures, spendCoins, addCoins } = get();
      if (ventures.some((v) => v.type === type)) return false;
      const template = VENTURE_TEMPLATES[type];
      if (!spendCoins(template.cost)) return false;

      const { data, error } = await createClient()
        .from("ventures")
        .insert({ user_id: user.id, venture_type: type })
        .select("id, venture_type, level, last_collected_at")
        .single();

      if (error || !data) {
        addCoins(template.cost);
        return false;
      }

      set((state) => ({
        ventures: [
          ...state.ventures,
          {
            id: data.id,
            type: data.venture_type as VentureType,
            level: data.level,
            lastCollectedAt: data.last_collected_at,
          },
        ],
      }));
      return true;
    },

    collectVenture: (id) => {
      const { user, ventures, addCoins } = get();
      const venture = ventures.find((v) => v.id === id);
      if (!venture) return;
      const template = VENTURE_TEMPLATES[venture.type];
      const earned = accruedCoins(template, venture.level, venture.lastCollectedAt);
      if (earned <= 0) return;
      const nowIso = new Date().toISOString();
      addCoins(earned);
      set((state) => ({
        ventures: state.ventures.map((v) => (v.id === id ? { ...v, lastCollectedAt: nowIso } : v)),
      }));
      void createClient().from("ventures").update({ last_collected_at: nowIso }).eq("id", id).eq("user_id", user.id);
    },

    upgradeVenture: (id) => {
      const { user, ventures, spendCoins } = get();
      const venture = ventures.find((v) => v.id === id);
      if (!venture) return false;
      const template = VENTURE_TEMPLATES[venture.type];
      const cost = ventureUpgradeCost(template, venture.level);
      if (!spendCoins(cost)) return false;
      const nextLevel = venture.level + 1;
      set((state) => ({
        ventures: state.ventures.map((v) => (v.id === id ? { ...v, level: nextLevel } : v)),
      }));
      void createClient().from("ventures").update({ level: nextLevel }).eq("id", id).eq("user_id", user.id);
      return true;
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
