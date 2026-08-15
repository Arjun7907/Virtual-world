import type { AvatarColor } from "@/lib/store";

export const AVATAR_COLORS: AvatarColor[] = [
  "indigo",
  "rose",
  "emerald",
  "amber",
  "sky",
  "violet",
];

export const AVATAR_HEX: Record<AvatarColor, string> = {
  indigo: "#6366f1",
  rose: "#f43f5e",
  emerald: "#10b981",
  amber: "#f59e0b",
  sky: "#0ea5e9",
  violet: "#8b5cf6",
};

export const AVATAR_BG_CLASS: Record<AvatarColor, string> = {
  indigo: "bg-indigo-500",
  rose: "bg-rose-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
};

export const AVATAR_RING_CLASS: Record<AvatarColor, string> = {
  indigo: "ring-indigo-400",
  rose: "ring-rose-400",
  emerald: "ring-emerald-400",
  amber: "ring-amber-400",
  sky: "ring-sky-400",
  violet: "ring-violet-400",
};
