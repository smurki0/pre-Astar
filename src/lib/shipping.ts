// Shared validation/normalisation for shipping zone payloads.
// Used by both the create and update admin API routes.

export interface NormalizedZone {
  name: string;
  cost: number;
  freeShippingMin: number;
  estimatedDays: string | null;
  countries: string;
  active: boolean;
  order: number;
}

export type ValidateZoneResult =
  | { data: NormalizedZone }
  | { error: string };

export function validateZonePayload(body: Record<string, unknown>): ValidateZoneResult {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return { error: 'اسم المنطقة مطلوب' };
  }

  const cost = Number(body.cost);
  if (!Number.isFinite(cost) || cost < 0) {
    return { error: 'سعر الشحن يجب أن يكون رقمًا صحيحًا غير سالب' };
  }

  const freeShippingMin = Number(body.freeShippingMin ?? 0);
  if (!Number.isFinite(freeShippingMin) || freeShippingMin < 0) {
    return { error: 'حد الشحن المجاني يجب أن يكون رقمًا صحيحًا غير سالب' };
  }

  const estimatedDays =
    typeof body.estimatedDays === 'string' ? body.estimatedDays.trim() : '';

  let countries = '[]';
  if (Array.isArray(body.countries)) {
    countries = JSON.stringify(body.countries.filter((c) => typeof c === 'string'));
  } else if (typeof body.countries === 'string' && body.countries.trim()) {
    countries = body.countries;
  }

  const active = body.active === undefined ? true : Boolean(body.active);
  const order = Number.isFinite(Number(body.order)) ? Number(body.order) : 0;

  return {
    data: {
      name,
      cost,
      freeShippingMin,
      estimatedDays: estimatedDays || null,
      countries,
      active,
      order,
    },
  };
}
