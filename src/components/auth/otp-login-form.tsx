"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { sendLoginOtp } from "@/actions/send-login-otp";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";

type Props = { googleEnabled: boolean };
type BusyState = "send" | "verify" | "google" | null;

export function OtpLoginForm({ googleEnabled }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [busy, setBusy] = useState<BusyState>(null);

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy("send");
    try {
      const result = await sendLoginOtp(email);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setEmail(email.trim().toLowerCase());
      setStep("otp");
      toast.success(result.message);
    } catch {
      toast.error("Could not request a sign-in code. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function verifyCode() {
    if (otp.length !== 6 || busy) return;

    setBusy("verify");
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        otp,
        redirect: false,
        redirectTo: "/dashboard",
      });

      if (!result || result.error) {
        toast.error("That code is invalid or expired. Request a new one and try again.");
        setOtp("");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      toast.error("Sign-in failed. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function continueWithGoogle() {
    if (busy) return;
    setBusy("google");
    try {
      await signIn("google", { redirectTo: "/dashboard" });
    } catch {
      toast.error("Google sign-in could not be started.");
      setBusy(null);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/70 shadow-xl shadow-black/5">
      <CardHeader className="space-y-2">
        <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Mail aria-hidden="true" className="size-5" />
        </div>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>
          {step === "email"
            ? "Enter your email and we will send you a one-time sign-in code."
            : `Enter the 6-digit code sent to ${email}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {step === "email" ? (
          <form className="space-y-4" onSubmit={requestCode}>
            <label className="grid gap-2 text-sm font-medium" htmlFor="email">
              Email address
              <Input
                autoComplete="email"
                id="email"
                maxLength={254}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>
            <Button className="w-full" disabled={busy !== null} type="submit">
              {busy === "send" && <LoaderCircle className="animate-spin" />}
              Send sign-in code
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid justify-center gap-2">
              <span className="text-sm font-medium">One-time code</span>
              <InputOTP
                aria-label="Six-digit sign-in code"
                maxLength={6}
                onChange={setOtp}
                value={otp}
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }, (_, index) => (
                    <InputOTPSlot index={index} key={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              className="w-full"
              disabled={otp.length !== 6 || busy !== null}
              onClick={verifyCode}
              type="button"
            >
              {busy === "verify" && <LoaderCircle className="animate-spin" />}
              Verify and sign in
            </Button>
            <Button
              className="w-full"
              disabled={busy !== null}
              onClick={() => {
                setStep("email");
                setOtp("");
              }}
              type="button"
              variant="ghost"
            >
              Change email
            </Button>
          </div>
        )}

        {googleEnabled && (
          <>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">OR</span>
              <Separator className="flex-1" />
            </div>
            <Button
              className="w-full"
              disabled={busy !== null}
              onClick={continueWithGoogle}
              type="button"
              variant="outline"
            >
              {busy === "google" && <LoaderCircle className="animate-spin" />}
              Continue with Google
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
