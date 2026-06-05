-- CERTIFIVE — Two-factor authentication (Email OTP)
-- Adds 2FA fields to users table

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_enabled    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_factor_otp_hash   text,
  ADD COLUMN IF NOT EXISTS two_factor_otp_expiry timestamptz;
