import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, DollarSign, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { apiRequest, formatCurrency } from "@/lib/api";

export default function DailyCapPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  const [enabled, setEnabled] = useState(false);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (settings) {
      setEnabled(settings.dailyCapEnabled);
      setAmount(settings.dailyCapAmount || "");
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("PUT", "/api/settings", data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to update settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings Updated", description: "Your daily cap has been saved." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    mutation.mutate({
      dailyCapEnabled: enabled,
      dailyCapAmount: enabled && amount ? amount : undefined,
    });
  };

  return (
    <SubPageLayout title="Daily Cap" backPath="/more">
      <div className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : (
          <>
            <Card className="mb-4">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Daily Spending Cap</CardTitle>
                    <CardDescription className="text-xs">
                      Get notified when you exceed your daily limit
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="cap-enabled">Enable Daily Cap</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive warnings when exceeded
                    </p>
                  </div>
                  <Switch
                    id="cap-enabled"
                    checked={enabled}
                    onCheckedChange={setEnabled}
                    data-testid="switch-cap-enabled"
                  />
                </div>

                {enabled && (
                  <div className="space-y-2">
                    <Label>Daily Limit (GHS)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        GH₵
                      </span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-12"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        data-testid="input-cap-amount"
                      />
                    </div>
                    {amount && parseFloat(amount) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        You'll be notified if daily spending exceeds {formatCurrency(amount)}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={mutation.isPending}
                  data-testid="button-save"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription className="text-sm">
                The daily cap is a soft limit - it won't prevent you from adding transactions,
                but will send you a notification when exceeded.
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>
    </SubPageLayout>
  );
}
