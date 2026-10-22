-- One phone number per account. Phone is collected by the app's own PhoneGate
-- (required at signup alongside the Clerk email), not by Clerk, so uniqueness
-- is enforced here. Partial index: rows without a phone are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON profiles (phone)
  WHERE phone IS NOT NULL AND phone <> '';
