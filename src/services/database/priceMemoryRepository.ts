import { getAppMeta, setAppMeta, META_KEYS } from './appMetaRepository';
import { ingredientKey, normalizeUnit } from '../../shared/utils/ingredientKey';

/** Last real price per unit the household paid for an ingredient. */
export interface RememberedPrice {
  unit: string;
  unitPrice: number;
  updatedAt: string;
}

/** ingredientKey → remembered price */
export type PriceMemory = Record<string, RememberedPrice>;

export async function getPriceMemory(userId: number): Promise<PriceMemory> {
  const raw = await getAppMeta(userId, META_KEYS.priceMemory);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as PriceMemory) : {};
  } catch {
    return {};
  }
}

export async function rememberPrices(
  userId: number,
  entries: Array<{ ingredientName: string; quantity: number; unit: string; price: number }>
): Promise<void> {
  const valid = entries.filter((e) => e.quantity > 0 && e.price > 0 && Number.isFinite(e.price));
  if (valid.length === 0) return;
  const memory = await getPriceMemory(userId);
  const now = new Date().toISOString();
  for (const e of valid) {
    memory[ingredientKey(e.ingredientName)] = {
      unit: normalizeUnit(e.unit),
      unitPrice: Math.round((e.price / e.quantity) * 10000) / 10000,
      updatedAt: now,
    };
  }
  await setAppMeta(userId, META_KEYS.priceMemory, JSON.stringify(memory));
}
