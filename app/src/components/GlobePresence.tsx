"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { useVirtualWorldStore } from "@/lib/store";
import { GLOBE_CHANNEL, GLOBE_CONSENT_KEY } from "@/lib/globeMap";
import { nearestCity } from "@/lib/cityAnchors";

type Consent = "unknown" | "granted" | "declined";

const REFRESH_MS = 5 * 60 * 1000;

const noopSubscribe = () => () => {};

function readStoredConsent(): Consent {
  const stored = localStorage.getItem(GLOBE_CONSENT_KEY);
  return stored === "granted" || stored === "declined" ? stored : "unknown";
}

function readStoredConsentServer(): Consent {
  return "unknown";
}

export default function GlobePresence() {
  const userId = useVirtualWorldStore((s) => s.user.id);
  const avatarName = useVirtualWorldStore((s) => s.avatarName);
  const avatarColor = useVirtualWorldStore((s) => s.avatarColor);

  const storedConsent = useSyncExternalStore(noopSubscribe, readStoredConsent, readStoredConsentServer);
  const [override, setOverride] = useState<Consent | null>(null);
  const consent = override ?? storedConsent;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (consent !== "granted") return;

    const supabase = createClient();
    const channel = supabase.channel(GLOBE_CHANNEL, { config: { presence: { key: userId } } });
    // Fixed once per session so viewers' join-ripple only fires on the
    // actual join, not on every periodic location refresh.
    const joinedAt = Date.now();

    function publishLocation() {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Snapped to the nearest of ~20 world city anchors (plus jitter)
          // rather than broadcasting the device's actual coordinates —
          // city-level only, never anything more precise.
          const { name: city, lat, lng } = nearestCity(pos.coords.latitude, pos.coords.longitude);
          channel.track({ userId, name: avatarName, color: avatarColor, city, lat, lng, joinedAt });
        },
        () => {},
        { maximumAge: 10 * 60 * 1000, timeout: 8000 }
      );
    }

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") publishLocation();
    });

    intervalRef.current = setInterval(publishLocation, REFRESH_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      supabase.removeChannel(channel);
    };
  }, [consent, userId, avatarName, avatarColor]);

  function grantConsent() {
    if (!navigator.geolocation) {
      declineConsent();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        localStorage.setItem(GLOBE_CONSENT_KEY, "granted");
        setOverride("granted");
      },
      () => {
        localStorage.setItem(GLOBE_CONSENT_KEY, "declined");
        setOverride("declined");
      }
    );
  }

  function declineConsent() {
    localStorage.setItem(GLOBE_CONSENT_KEY, "declined");
    setOverride("declined");
  }

  if (consent !== "unknown") return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur sm:flex-row sm:items-center">
      <p className="flex-1 text-sm text-slate-300">
        🌍 Show yourself on the live global map on our homepage? We only ever show your nearest major city —
        never your exact location — and only while you&apos;re online. Nothing is stored.
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={declineConsent}
          className="rounded-full border border-slate-700 px-4 py-1.5 text-sm text-slate-300 hover:border-slate-500"
        >
          No thanks
        </button>
        <button
          onClick={grantConsent}
          className="rounded-full bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-400"
        >
          Share location
        </button>
      </div>
    </div>
  );
}
