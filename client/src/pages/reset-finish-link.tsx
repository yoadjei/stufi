import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
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
import { resetFinishLinkSchema } from "@shared/schema";
import type { z } from "zod";

type FormData = z.infer<typeof resetFinishLinkSchema>;

export default function ResetFinishLinkPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const tokenFromUrl = searchParams.get("token") || "";

  const form = useForm<FormData & { confirmPassword: string }>({
    resolver: zodResolver(
      resetFinishLinkSchema.extend({
        confirmPassword: resetFinishLinkSchema.shape.newPassword,
      }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      })
    ),
    defaultValues: {
      token: tokenFromUrl,
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (tokenFromUrl) {
      form.setValue("token", tokenFromUrl);
    }
  }, [tokenFromUrl, form]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/auth/reset/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: data.token,
          newPassword: data.newPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || "Reset failed");
      }
      toast({ title: "Password Reset", description: "You can now sign in with your new password." });
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Reset failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Set New Password" subtitle="Enter your reset token and new password">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {!tokenFromUrl && (
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reset Token</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Paste token from email"
                      data-testid="input-token"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      data-testid="input-new-password"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
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
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    data-testid="input-confirm-password"
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
            data-testid="button-reset"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Password"
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
