"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useVirtualWorldStore } from "@/lib/store";
import type { AvatarColor } from "@/lib/store";

export interface PresenceUser {
  userId: string;
  name: string;
  color: AvatarColor;
  x?: number;
  y?: number;
}

/**
 * Tracks who else is live in a given "room" (a page or hub zone) via
 * Supabase Realtime Presence. No database table involved — presence state
 * lives only in the realtime server for as long as a client stays connected.
 */
export function usePresence(room: string) {
  const userId = useVirtualWorldStore((s) => s.user.id);
  const avatarName = useVirtualWorldStore((s) => s.avatarName);
  const avatarColor = useVirtualWorldStore((s) => s.avatarColor);

  const [others, setOthers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const selfRef = useRef<PresenceUser>({ userId, name: avatarName, color: avatarColor });

  useEffect(() => {
    selfRef.current = { ...selfRef.current, userId, name: avatarName, color: avatarColor };
    channelRef.current?.track(selfRef.current);
  }, [userId, avatarName, avatarColor]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`presence:${room}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const list = Object.values(state)
          .map((entries) => entries[0])
          .filter((p): p is PresenceUser & { presence_ref: string } => Boolean(p) && p.userId !== userId);
        setOthers(list);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track(selfRef.current);
        }
      });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      setOthers([]);
      supabase.removeChannel(channel);
    };
  }, [room, userId]);

  const updatePosition = useCallback((x: number, y: number) => {
    selfRef.current = { ...selfRef.current, x, y };
    channelRef.current?.track(selfRef.current);
  }, []);

  return { others, updatePosition };
}
