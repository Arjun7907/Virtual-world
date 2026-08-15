"use client";

import { createContext, useContext } from "react";
import { createStore, useStore } from "zustand";
import { createClient } from "@/lib/supabase/client";

export type AvatarColor = "indigo" | "rose" | "emerald" | "amber" | "sky" | "violet";

export interface AuthUser {
  id: string;
  email: string;
}

export interface VirtualWorldInit {
  user: AuthUser;
  avatarName: string;
  avatarColor: AvatarColor;
}

interface VirtualWorldState extends VirtualWorldInit {
  setAvatarColor: (color: AvatarColor) => void;
  setAvatarName: (name: string) => void;
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
