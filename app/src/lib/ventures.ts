export type VentureType = "coffee_cart" | "flip_shop" | "startup";

export interface VentureTemplate {
  type: VentureType;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  baseRatePerHour: number;
  capHours: number;
}

export const VENTURE_TEMPLATES: Record<VentureType, VentureTemplate> = {
  coffee_cart: {
    type: "coffee_cart",
    name: "Coffee Cart",
    emoji: "☕",
    description: "A small cart on a busy corner. Steady, low-risk income.",
    cost: 100,
    baseRatePerHour: 4,
    capHours: 8,
  },
  flip_shop: {
    type: "flip_shop",
    name: "Flip Shop",
    emoji: "🔄",
    description: "Buy low, sell high. Better margins, bigger buy-in.",
    cost: 250,
    baseRatePerHour: 9,
    capHours: 8,
  },
  startup: {
    type: "startup",
    name: "Tech Startup",
    emoji: "🚀",
    description: "High risk, high reward — the best long-term payout.",
    cost: 600,
    baseRatePerHour: 20,
    capHours: 8,
  },
};

export function ventureRate(template: VentureTemplate, level: number) {
  return template.baseRatePerHour * level;
}

export function ventureUpgradeCost(template: VentureTemplate, level: number) {
  return Math.round(template.cost * 0.6 * level);
}

export function accruedCoins(
  template: VentureTemplate,
  level: number,
  lastCollectedAt: string,
  now: number = Date.now()
) {
  const elapsedMs = Math.max(0, now - new Date(lastCollectedAt).getTime());
  const cappedMs = Math.min(elapsedMs, template.capHours * 60 * 60 * 1000);
  const hours = cappedMs / (60 * 60 * 1000);
  return Math.floor(hours * ventureRate(template, level));
}
