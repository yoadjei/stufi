import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { apiRequest } from "@/lib/api";
import { insertCycleSchema } from "@shared/schema";
import { format } from "date-fns";
import type { z } from "zod";

type FormData = z.infer<typeof insertCycleSchema>;

export default function NewCyclePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(insertCycleSchema),
    defaultValues: {
      startDate: format(new Date(), "yyyy-MM-dd"),
      nextAllowanceDate: "",
      startingBalance: "",
      expectedNextAmount: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/cycles", data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to create cycle");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cycles/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      toast({ title: "Budget Created", description: "Your new budget period has started." });
      
      if (window.history.length > 2) {
        window.history.back();
      } else {
        setLocation("/cycles");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <SubPageLayout title="New Budget" backPath="/cycles">
      <div className="max-w-lg mx-auto px-4 py-6">
        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription className="text-sm">
            Starting a new budget will automatically close any active budget period.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                              data-testid="input-start-date"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextAllowanceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Allowance Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                              data-testid="input-next-allowance"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value), "PPP") : "When is your next allowance?"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        The cycle will end on this date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startingBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting Balance (GHS)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            GH₵
                          </span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-12"
                            data-testid="input-starting-balance"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        How much do you have to spend this cycle?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedNextAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Next Allowance (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            GH₵
                          </span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-10"
                            data-testid="input-expected-amount"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        For better forecasting
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={mutation.isPending}
                  data-testid="button-create-cycle"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Start Cycle"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </SubPageLayout>
  );
}
