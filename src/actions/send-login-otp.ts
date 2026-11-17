"use server";

import { and, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { otpChallenges } from "@/db/schema";
import {
  generateOtp,
  hashOtp,
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/otp";
import { sendLoginOtpEmail } from "@/lib/mail";

const emailSchema = z.string().trim().email().max(254);

export async function sendLoginOtp(value: unknown) {
  const parsed = emailSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false as const, message: "Enter a valid email address." };
  }

  const email = parsed.data.toLowerCase();
  const otp = generateOtp();
  const codeHash = hashOtp(email, otp);
  const now = new Date();
  const db = getDb();

  const [challenge] = await db
    .insert(otpChallenges)
    .values({
      email,
      codeHash,
      expiresAt: new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60_000),
      attempts: 0,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: otpChallenges.email,
      set: {
        codeHash,
        expiresAt: new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60_000),
        attempts: 0,
        createdAt: now,
      },
      setWhere: lt(
        otpChallenges.createdAt,
        new Date(now.getTime() - OTP_RESEND_COOLDOWN_SECONDS * 1_000),
      ),
    })
    .returning({ email: otpChallenges.email });

  if (!challenge) {
    return {
      ok: false as const,
      message: `Please wait ${OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting another code.`,
    };
  }

  try {
    await sendLoginOtpEmail(email, otp);
  } catch (error) {
    await db
      .delete(otpChallenges)
      .where(and(eq(otpChallenges.email, email), eq(otpChallenges.codeHash, codeHash)));
    console.error("Could not send login OTP email.", error);
    return {
      ok: false as const,
      message: "We could not send the email. Check the mail settings and try again.",
    };
  }

  return { ok: true as const, message: "Sign-in code sent. Check your email." };
}
