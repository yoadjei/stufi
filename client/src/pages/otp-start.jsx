import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
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
import { apiBase } from "@/lib/api";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { otpStartSchema } from "@shared/schema";

export default function OtpStartPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(otpStartSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/auth/otp/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to send code");
      }
      toast({
        title: "Code Sent!",
        description: `A 6-digit code was sent to ${data.email}. Check your inbox (and spam).`,
      });
      setLocation(`/otp/verify?email=${encodeURIComponent(data.email)}`);
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

  return (
    <AuthLayout
      title="Sign in with Email"
      subtitle="We'll send a one-time 6-digit code to your email address"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@university.edu"
                    data-testid="input-email"
                    autoFocus
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={isLoading}
            data-testid="button-send-code"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Code...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Code to Email
              </>
            )}
          </Button>
        </form>
      </Form>

      <p className="mt-4 text-xs text-center text-muted-foreground">
        Didn't get an email? Check your spam folder or try again.
      </p>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          data-testid="link-back"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
