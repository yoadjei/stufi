import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Eye, EyeOff, Wallet, Calendar, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, formatDate, getDaysRemaining } from "@/lib/api";
import type { Cycle, AnalyticsSummary } from "@shared/schema";

export default function CyclesPage() {
  const [hideBalance, setHideBalance] = useState(false);
  
  const { data: cycles, isLoading } = useQuery<Cycle[]>({
    queryKey: ["/api/cycles"],
  });

  const { data: analytics } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary"],
  });

  const currentCycle = cycles?.find((c) => c.status === "active");
  const pastCycles = cycles?.filter((c) => c.status === "closed") || [];
  const daysLeft = currentCycle ? getDaysRemaining(currentCycle.nextAllowanceDate) : 0;

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-5 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">My Budgets</h1>
          <p className="text-sm text-muted-foreground">Manage your allowance periods</p>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : (
          <>
            <Card className="mb-6 shadow-sm border-0 bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current balance</p>
                    <p className="text-2xl font-bold" data-testid="text-total-balance">
                      {hideBalance ? "GHS ••••••" : formatCurrency(analytics?.currentBalance || "0")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setHideBalance(!hideBalance)}
                    data-testid="button-toggle-balance"
                  >
                    {hideBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {currentCycle ? (
              <section className="mb-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Active Budget
                </h2>
                <Link href={`/cycles/${currentCycle.id}`}>
                  <Card className="hover-elevate cursor-pointer shadow-sm bg-gradient-to-r from-emerald-50 to-white">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-emerald-100 text-emerald-700 border-0" data-testid="badge-active">
                              Active
                            </Badge>
                          </div>
                          <p className="font-semibold" data-testid="text-cycle-dates">
                            {formatDate(currentCycle.startDate)} - {formatDate(currentCycle.nextAllowanceDate)}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Started with</p>
                          <p className="font-semibold text-sm">
                            {hideBalance ? "•••" : formatCurrency(currentCycle.startingBalance)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                          <p className="font-semibold text-sm text-emerald-600">
                            {hideBalance ? "•••" : formatCurrency(analytics?.currentBalance || "0")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Days left</p>
                          <p className="font-semibold text-sm">{daysLeft}</p>
                        </div>
                      </div>
                      
                      {analytics?.safePerDay && (
                        <div className="mt-4 p-3 rounded-lg bg-primary/5">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className="text-sm">
                              Safe to spend: <strong>{formatCurrency(analytics.safePerDay)}/day</strong>
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </section>
            ) : (
              <section className="mb-6">
                <Card className="border-dashed border-2">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">No Active Budget</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start tracking your allowance by creating a new budget period.
                    </p>
                    <Link href="/cycles/new">
                      <Button className="rounded-full" data-testid="button-start-cycle">
                        <Plus className="w-4 h-4 mr-2" />
                        Start New Budget
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </section>
            )}

            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Past Budgets
                </h2>
                {currentCycle && (
                  <Link href="/cycles/new">
                    <Button variant="ghost" size="sm" className="text-primary" data-testid="button-new-cycle">
                      <Plus className="w-4 h-4 mr-1" />
                      New
                    </Button>
                  </Link>
                )}
              </div>
              
              {pastCycles.length > 0 ? (
                <div className="space-y-3">
                  {pastCycles.map((cycle) => (
                    <Link key={cycle.id} href={`/cycles/${cycle.id}`}>
                      <Card className="hover-elevate cursor-pointer">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {formatDate(cycle.startDate)} - {formatDate(cycle.nextAllowanceDate)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Started: {hideBalance ? "•••" : formatCurrency(cycle.startingBalance)}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">Completed</Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-sm bg-gray-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No past budgets yet. Complete your first budget period to see history here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>

            <Card className="border-0 shadow-sm bg-amber-50">
              <CardContent className="p-4">
                <p className="text-sm text-center">
                  A budget represents one allowance period - from when you receive money until your next allowance.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
