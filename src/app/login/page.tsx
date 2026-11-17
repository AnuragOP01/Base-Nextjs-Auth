import { connection } from "next/server";
import { OtpLoginForm } from "@/components/auth/otp-login-form";

export default async function LoginPage() {
  await connection();
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <OtpLoginForm googleEnabled={googleEnabled} />
    </main>
  );
}
