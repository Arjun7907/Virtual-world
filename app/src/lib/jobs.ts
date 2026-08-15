export type JobId = "barista" | "courier" | "warehouse";

export const SHIFTS_PER_LEVEL = 5;
export const MAX_JOB_LEVEL = 10;

interface JobTier {
  level: number;
  title: string;
}

export const JOB_TIERS: Record<JobId, JobTier[]> = {
  barista: [
    { level: 1, title: "Trainee Barista" },
    { level: 3, title: "Barista" },
    { level: 5, title: "Head Barista" },
    { level: 8, title: "Café Manager" },
  ],
  courier: [
    { level: 1, title: "Rookie Courier" },
    { level: 3, title: "Courier" },
    { level: 5, title: "Senior Courier" },
    { level: 8, title: "Dispatch Lead" },
  ],
  warehouse: [
    { level: 1, title: "Warehouse Hand" },
    { level: 3, title: "Warehouse Associate" },
    { level: 5, title: "Shift Lead" },
    { level: 8, title: "Warehouse Manager" },
  ],
};

export function levelForShifts(shifts: number) {
  return Math.min(MAX_JOB_LEVEL, Math.floor(shifts / SHIFTS_PER_LEVEL) + 1);
}

export function titleForLevel(jobId: JobId, level: number) {
  const tiers = JOB_TIERS[jobId];
  let title = tiers[0].title;
  for (const tier of tiers) {
    if (level >= tier.level) title = tier.title;
  }
  return title;
}

export function payMultiplier(level: number) {
  return 1 + 0.15 * (level - 1);
}

export function shiftsToNextLevel(shifts: number) {
  const level = levelForShifts(shifts);
  if (level >= MAX_JOB_LEVEL) return null;
  return level * SHIFTS_PER_LEVEL - shifts;
}
