/// Same rule as the website (`src/lib/phone.ts`): digits with an optional
/// leading "+", valid when it has 10–15 digits.
({String phone, bool valid}) normalizePhone(String raw) {
  final phone = raw.replaceAll(RegExp(r'[^\d+]'), '').replaceAll(RegExp(r'(?!^)\+'), '');
  final digits = phone.replaceAll(RegExp(r'\D'), '');
  return (phone: phone, valid: digits.length >= 10 && digits.length <= 15);
}
