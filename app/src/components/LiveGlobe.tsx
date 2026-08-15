"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GlobeMethods } from "react-globe.gl";
import { AVATAR_HEX } from "@/lib/avatarColors";
import type { GlobeViewer } from "@/lib/globeMap";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const RIPPLE_LIFETIME_MS = 2600;

interface Point {
  userId: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  color: string;
}

export default function LiveGlobe({
  viewers,
  onSelect,
  className = "mx-auto aspect-square w-full max-w-[440px]",
}: {
  viewers: GlobeViewer[];
  onSelect?: (viewer: GlobeViewer) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [dims, setDims] = useState({ width: 360, height: 360 });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setDims({ width: Math.round(rect.width), height: Math.round(rect.height) });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Drives the ripple fade — cheap tick, not per-frame.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  const points: Point[] = viewers.map((v) => ({
    userId: v.userId,
    name: v.name,
    city: v.city,
    lat: v.lat,
    lng: v.lng,
    color: AVATAR_HEX[v.color],
  }));

  const byUserId = new Map(viewers.map((v) => [v.userId, v]));

  const rings = viewers
    .filter((v) => now - v.joinedAt < RIPPLE_LIFETIME_MS)
    .map((v) => ({ lat: v.lat, lng: v.lng, color: AVATAR_HEX[v.color] }));

  return (
    <div ref={containerRef} className={className}>
      <Globe
        ref={globeRef}
        width={dims.width}
        height={dims.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="/earth-night.jpg"
        showAtmosphere
        atmosphereColor="#818cf8"
        atmosphereAltitude={0.22}
        showGraticules
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.02}
        pointRadius={0.5}
        pointLabel={(p: object) => {
          const point = p as Point;
          return `${point.name} — near ${point.city}`;
        }}
        onPointClick={(p: object) => {
          const point = p as Point;
          const viewer = byUserId.get(point.userId);
          if (viewer) onSelect?.(viewer);
        }}
        ringsData={rings}
        ringLat="lat"
        ringLng="lng"
        ringColor={(r: object) => {
          const color = (r as { color: string }).color;
          return (t: number) => {
            const alpha = Math.round((1 - t) * 255)
              .toString(16)
              .padStart(2, "0");
            return `${color}${alpha}`;
          };
        }}
        ringMaxRadius={4}
        ringPropagationSpeed={2.4}
        ringRepeatPeriod={RIPPLE_LIFETIME_MS}
        onGlobeReady={() => {
          const controls = globeRef.current?.controls();
          if (controls) {
            // Behaves like a draggable map: no auto-rotation fighting the
            // user's input, free rotate + zoom so they're fully in control.
            controls.autoRotate = false;
            controls.enableZoom = true;
            controls.enableRotate = true;
            controls.rotateSpeed = 0.6;
            controls.zoomSpeed = 0.8;
          }
        }}
      />
    </div>
  );
}
