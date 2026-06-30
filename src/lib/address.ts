// Shared helpers to convert between the profile-UI address shape and DB columns.

export function normalizeAddress(body: Record<string, unknown>) {
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const city = typeof body.city === 'string' ? body.city.trim() : '';
  const postalCode = typeof body.postalCode === 'string' ? body.postalCode.trim() : '';
  const label = typeof body.label === 'string' ? body.label.trim() : '';

  if (!firstName || !lastName) return { error: 'الاسم الأول واسم العائلة مطلوبان' } as const;
  if (!phone || phone.length < 10) return { error: 'رقم هاتف صحيح مطلوب' } as const;
  if (!address || address.length < 5) return { error: 'العنوان مطلوب' } as const;
  if (!city) return { error: 'المدينة مطلوبة' } as const;

  return {
    data: {
      label: label || 'Home',
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      phone,
      addressLine1: address,
      city,
      postalCode: postalCode || '',
      isDefault: Boolean(body.isDefault),
    },
  } as const;
}

export function toUiAddress(a: {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}) {
  return {
    id: a.id,
    label: a.label || 'Home',
    firstName: a.firstName || '',
    lastName: a.lastName || '',
    phone: a.phone,
    address: a.addressLine1,
    city: a.city,
    postalCode: a.postalCode,
    isDefault: a.isDefault,
  };
}
