// Mock Redis implementation for emergency build
export const redis = {
  get: async () => null,
  set: async () => null,
  setex: async () => null,
  del: async () => null,
  keys: async () => [] as string[],
};

export const CACHE_TIMES = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  ONE_HOUR: 3600,
  ONE_DAY: 86400,
  ONE_WEEK: 604800,
} as const;

export async function getCachedData<T>(): Promise<T | null> {
  return null;
}

export async function setCachedData<T>(): Promise<void> {
  return;
}

export async function invalidateCache(): Promise<void> {
  return;
}

export async function invalidateCachePattern(): Promise<void> {
  return;
} 