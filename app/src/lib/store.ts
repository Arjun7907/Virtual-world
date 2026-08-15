"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AvatarColor = "indigo" | "rose" | "emerald" | "amber" | "sky" | "violet";

export interface InventoryItem {
  id: string;
  name: string;
  emoji: string;
  category: "shop" | "kitchen" | "arcade";
}

export interface AuthUser {
  name: string;
  email: string;
}

interface GameStats {
  ticTacToeWins: number;
  memoryWins: number;
  recipesCooked: number;
}

interface VirtualWorldState {
  user: AuthUser | null;
  avatarColor: AvatarColor;
  avatarName: string;
  coins: number;
  inventory: InventoryItem[];
  stats: GameStats;

  login: (user: AuthUser) => void;
  logout: () => void;
  setAvatarColor: (color: AvatarColor) => void;
  setAvatarName: (name: string) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addInventoryItem: (item: InventoryItem) => void;
  recordWin: (game: keyof GameStats) => void;
}

const STARTING_COINS = 150;

export const useVirtualWorldStore = create<VirtualWorldState>()(
  persist(
    (set, get) => ({
      user: null,
      avatarColor: "indigo",
      avatarName: "Explorer",
      coins: STARTING_COINS,
      inventory: [],
      stats: { ticTacToeWins: 0, memoryWins: 0, recipesCooked: 0 },

      login: (user) =>
        set((state) => ({
          user,
          avatarName: state.avatarName === "Explorer" ? user.name.split(" ")[0] : state.avatarName,
        })),

      logout: () => set({ user: null }),

      setAvatarColor: (avatarColor) => set({ avatarColor }),
      setAvatarName: (avatarName) => set({ avatarName }),

      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),

      spendCoins: (amount) => {
        const { coins } = get();
        if (coins < amount) return false;
        set({ coins: coins - amount });
        return true;
      },

      addInventoryItem: (item) =>
        set((state) => ({ inventory: [...state.inventory, item] })),

      recordWin: (game) =>
        set((state) => ({
          stats: { ...state.stats, [game]: state.stats[game] + 1 },
        })),
    }),
    {
      name: "virtual-world-state",
    }
  )
);
