"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AvatarColor } from "@/lib/store";

export const GLOBE_CHANNEL = "presence:globe-map";
export const GLOBE_CONSENT_KEY = "virtual-world:globe-consent";

export interface GlobeViewer {
  userId: string;
  name: string;
  color: AvatarColor;
  city: string;
  lat: number;
  lng: number;
  joinedAt: number;
}

/**
 * Read-only: who's currently broadcasting their (opted-in, city-level)
 * location. Safe to use from an unauthenticated page — presence channels
 * aren't gated by table RLS, only the publishable key is needed.
 */
export function useGlobeViewers() {
  const [viewers, setViewers] = useState<GlobeViewer[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(GLOBE_CHANNEL);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<GlobeViewer>();
        const list = Object.values(state)
          .map((entries) => entries[0])
          .filter((p): p is GlobeViewer & { presence_ref: string } => Boolean(p));
        setViewers(list);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return viewers;
}
