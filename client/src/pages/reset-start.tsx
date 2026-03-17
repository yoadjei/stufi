import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Loader2, ArrowLeft, Mail, Link as LinkIcon } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiBase } from "@/lib/api";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { resetStartSchema } from "@shared/schema";
import type { z } from "zod";

type FormData = z.infer<typeof resetStartSchema>;

export default function ResetStartPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<FormData>({
    resolver: zodResolver(resetStartSchema),
    defaultValues: {
      email: "",
      method: "code",
    },
  });

  const method = form.watch("method");

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/auth/reset/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to send reset");
      }
      toast({
        title: "Check Your Email",
        description: data.method === "link"
          ? "We've sent a password reset link to your email."
          : "We've sent a 6-digit reset code to your email.",
      });
      if (data.method === "code") {
        setLocation(`/reset/finish-code?email=${encodeURIComponent(data.email)}`);
      } else {
        // If they chose link, they just wait for the email.
        setLocation(`/login`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reset",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Choose how you'd like to reset your password">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reset Method</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="space-y-3"
                  >
                    <div
                      className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        method === "code"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => field.onChange("code")}
                    >
                      <RadioGroupItem value="code" id="code" data-testid="radio-code" />
                      <Mail className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <Label htmlFor="code" className="text-sm font-medium cursor-pointer">
                          Send Reset Code
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Receive a 6-digit code via email
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        method === "link"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => field.onChange("link")}
                    >
                      <RadioGroupItem value="link" id="link" data-testid="radio-link" />
                      <LinkIcon className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <Label htmlFor="link" className="text-sm font-medium cursor-pointer">
                          Send Reset Link
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Receive a clickable link via email
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={isLoading}
            data-testid="button-send"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              method === "code" ? "Send Reset Code" : "Send Reset Link"
            )}
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center">
        <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground" data-testid="link-back">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
