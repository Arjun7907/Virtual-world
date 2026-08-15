"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GlobeMethods } from "react-globe.gl";
import { AVATAR_HEX } from "@/lib/avatarColors";
import type { GlobeViewer } from "@/lib/globeMap";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export default function LiveGlobe({ viewers }: { viewers: GlobeViewer[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState(360);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setSize(Math.round(width));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const points = viewers.map((v) => ({
    lat: v.lat,
    lng: v.lng,
    color: AVATAR_HEX[v.color],
    name: v.name,
  }));

  return (
    <div ref={containerRef} className="mx-auto aspect-square w-full max-w-[440px]">
      <Globe
        ref={globeRef}
        width={size}
        height={size}
        backgroundColor="rgba(0,0,0,0)"
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
        pointLabel="name"
        onGlobeReady={() => {
          const controls = globeRef.current?.controls();
          if (controls) {
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.6;
            controls.enableZoom = false;
          }
        }}
      />
    </div>
  );
}
