import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(email: string, otp: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required to issue or verify OTPs.");
  }

  return createHmac("sha256", secret)
    .update(`${email}:${otp}`)
    .digest("hex");
}

export function matchesOtpHash(storedHash: string, email: string, otp: string) {
  const suppliedHash = Buffer.from(hashOtp(email, otp), "hex");
  const expectedHash = Buffer.from(storedHash, "hex");

  return (
    suppliedHash.length === expectedHash.length &&
    timingSafeEqual(suppliedHash, expectedHash)
  );
}
