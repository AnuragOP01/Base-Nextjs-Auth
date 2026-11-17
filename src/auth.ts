import { and, eq, gt, lt, sql } from "drizzle-orm";
import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/db";
import {
  accounts,
  otpChallenges,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";
import { matchesOtpHash, OTP_MAX_ATTEMPTS } from "@/lib/otp";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string };
  }
}

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  otp: z.string().regex(/^\d{6}$/),
});

const credentialsProvider = Credentials({
  credentials: {
    email: { label: "Email", type: "email" },
    otp: { label: "One-time code", type: "text" },
  },
  async authorize(credentials) {
    const parsed = credentialsSchema.safeParse(credentials);
    if (!parsed.success) return null;

    const email = parsed.data.email.toLowerCase();
    const db = getDb();
    const [challenge] = await db
      .update(otpChallenges)
      .set({ attempts: sql`${otpChallenges.attempts} + 1` })
      .where(
        and(
          eq(otpChallenges.email, email),
          gt(otpChallenges.expiresAt, new Date()),
          lt(otpChallenges.attempts, OTP_MAX_ATTEMPTS),
        ),
      )
      .returning({ codeHash: otpChallenges.codeHash });

    if (!challenge || !matchesOtpHash(challenge.codeHash, email, parsed.data.otp)) {
      return null;
    }

    const [consumed] = await db
      .delete(otpChallenges)
      .where(
        and(
          eq(otpChallenges.email, email),
          eq(otpChallenges.codeHash, challenge.codeHash),
        ),
      )
      .returning({ email: otpChallenges.email });

    if (!consumed) return null;

    const [user] = await db
      .insert(users)
      .values({ email, emailVerified: new Date() })
      .onConflictDoUpdate({
        target: users.email,
        set: { emailVerified: new Date() },
      })
      .returning();

    return user ?? null;
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth(
  async (): Promise<NextAuthConfig> => {
    const providers: NextAuthConfig["providers"] = [credentialsProvider];

    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      providers.push(
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      );
    }

    return {
      adapter: DrizzleAdapter(getDb(), {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      }),
      providers,
      session: { strategy: "jwt" },
      callbacks: {
        session({ session, token }) {
          if (session.user && token.sub) session.user.id = token.sub;
          return session;
        },
      },
    };
  },
);
