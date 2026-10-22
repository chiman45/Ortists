// Normalise a phone number to digits with an optional leading "+", so
// "98765 43210" and "9876543210" are treated as the same number.
export function normalizePhone(raw: string): { phone: string; valid: boolean } {
  const phone = raw.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  const digits = phone.replace(/\D/g, "");
  return { phone, valid: digits.length >= 10 && digits.length <= 15 };
}
