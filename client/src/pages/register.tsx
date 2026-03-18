import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useAuth } from "@/lib/auth";
import { apiBase } from "@/lib/api";
import { registerUserSchema } from "@shared/schema";
import type { z } from "zod";

type FormData = z.infer<typeof registerUserSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const [otp, setOtp] = useState("");
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<FormData & { confirmPassword: string }>({
    resolver: zodResolver(
      registerUserSchema.extend({
        confirmPassword: registerUserSchema.shape.password,
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      })
    ),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      department: "",
      level: "",
    },
  });

  const onStep1Submit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/auth/register/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to send code");
      }
      setPendingData(data);
      setStep(2);
      toast({ title: "Check Your Email", description: "We've sent a 6-digit verification code." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingData) return;
    if (otp.length !== 6) {
      toast({ title: "Error", description: "Please enter the 6-digit code", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingData, otp }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || "Registration failed");
      }
      login(result.user, result.token);
      toast({ title: "Welcome!", description: "Account created successfully." });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Registration failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 2) {
    return (
      <AuthLayout title="Verify Your Email" subtitle={`Enter the 6-digit code sent to ${pendingData?.email}`}>
        <form onSubmit={onStep2Submit} className="space-y-5">
          <div>
            <label className="text-sm font-medium leading-none">Verification Code</label>
            <Input
              className="mt-2 text-center text-2xl font-bold tracking-[0.5em] h-14"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              data-testid="input-otp"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold rounded-full"
            disabled={isLoading || otp.length !== 6}
            data-testid="button-verify"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <button
            type="button"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => { setStep(1); setOtp(""); }}
            data-testid="link-back"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create Account" subtitle="Join StuFi and take control of your finances">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onStep1Submit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    data-testid="input-name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@university.edu"
                    data-testid="input-email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Computer Science"
                      data-testid="input-department"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 300"
                      data-testid="input-level"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+233 020 123 4567"
                    data-testid="input-phone"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      data-testid="input-password"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm password"
                      data-testid="input-confirm-password"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirm(!showConfirm)}
                      data-testid="button-toggle-confirm"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold rounded-full"
            disabled={isLoading}
            data-testid="button-register"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Code...
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline" data-testid="link-login">
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
