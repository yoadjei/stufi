import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useAuth } from "@/lib/auth";
import { apiBase } from "@/lib/api";
import { Link } from "wouter";

export default function OtpVerifyPage() {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (!email) {
      setLocation("/otp/start");
    }
  }, [email, setLocation]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || "Verification failed");
      }
      // OTP sign-in always remembers the session (same as "remember me" checked)
      login(result.user, result.token, result.needsProfile, true);
      toast({ title: "Welcome!", description: "Signed in successfully." });
      if (result.needsProfile) {
        setLocation("/complete-profile");
      } else {
        setLocation("/");
      }
    } catch (error) {
      toast({
        title: "Invalid Code",
        description: error instanceof Error ? error.message : "The code is incorrect or has expired. Please try again.",
        variant: "destructive",
      });
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setCanResend(false);
    setResendTimer(60);
    try {
      const response = await fetch(`${apiBase}/api/auth/otp/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to resend");
      }
      toast({ title: "New Code Sent", description: "Check your inbox (and spam folder)." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend code",
        variant: "destructive",
      });
      setCanResend(true);
    } finally {
      setIsResending(false);
    }
  };

  // Auto-verify when all 6 digits are entered
  useEffect(() => {
    if (otp.length === 6) {
      handleVerify();
    }
  }, [otp]);

  // Mask email for display: z***@gmail.com
  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_m, a, _b, c) => `${a}***${c}`)
    : "";

  return (
    <AuthLayout
      title="Enter Your Code"
      subtitle={`We sent a 6-digit code to ${maskedEmail}`}
    >
      <div className="flex flex-col items-center space-y-6">
        <InputOTP
          value={otp}
          onChange={setOtp}
          maxLength={6}
          disabled={isLoading}
          data-testid="input-otp"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>

        <p className="text-xs text-muted-foreground text-center">
          Code expires in 10 minutes. Check your spam folder if you can't find it.
        </p>

        <Button
          onClick={handleVerify}
          className="w-full h-12 text-base font-semibold"
          disabled={isLoading || otp.length !== 6}
          data-testid="button-verify"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Code"
          )}
        </Button>

        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
          <Button
            variant="ghost"
            onClick={handleResend}
            disabled={!canResend || isResending}
            className="text-primary"
            data-testid="button-resend"
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                Sending...
              </>
            ) : canResend ? (
              "Resend Code"
            ) : (
              `Resend in ${resendTimer}s`
            )}
          </Button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/otp/start"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          data-testid="link-back"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Change Email
        </Link>
      </div>
    </AuthLayout>
  );
}
