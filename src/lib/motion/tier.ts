export type Tier = 'full' | 'lite' | 'static';
export type ActiveTier = Exclude<Tier, 'static'>;

export type Capabilities = {
  reducedMotion: boolean;
  coarsePointer: boolean;
  width: number;
  deviceMemory?: number;
  cores?: number;
  saveData?: boolean;
};

const TIERS: readonly Tier[] = ['full', 'lite', 'static'];

export function resolveTier(c: Capabilities): Tier {
  if (c.reducedMotion || c.saveData) return 'static';
  const weakMemory = c.deviceMemory !== undefined && c.deviceMemory < 2;
  const weakPhone = c.coarsePointer && c.cores !== undefined && c.cores < 4;
  if (weakMemory || weakPhone) return 'static';
  if (c.coarsePointer || c.width < 768) return 'lite';
  return 'full';
}

/** `?motion=full|lite|static` força um nível (útil para testar e para depurar em aparelho real). */
export function parseMotionOverride(search: string): Tier | null {
  const value = new URLSearchParams(search).get('motion');
  return value && (TIERS as readonly string[]).includes(value) ? (value as Tier) : null;
}

export function readCapabilities(): Capabilities {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    width: window.innerWidth,
    deviceMemory: nav.deviceMemory,
    cores: nav.hardwareConcurrency,
    saveData: nav.connection?.saveData,
  };
}
