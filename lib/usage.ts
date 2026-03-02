export const DEFAULT_DAILY_REQUEST_LIMIT = 20;

export function canUseFeature(used: number, limit: number): boolean {
  return used < limit;
}

export function getDailyRequestLimit(): number {
  const raw = process.env.DAILY_REQUEST_LIMIT;
  if (!raw) {
    return DEFAULT_DAILY_REQUEST_LIMIT;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_DAILY_REQUEST_LIMIT;
  }

  return parsed;
}
