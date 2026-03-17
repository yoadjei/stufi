import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Calendar, Wallet, TrendingUp, Clock, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { formatCurrency, formatDate, formatDateTime, getDaysRemaining } from "@/lib/api";
import type { Cycle, Transaction, Category } from "@shared/schema";

export default function CycleDetailPage() {
  const [, params] = useRoute("/cycles/:id");
  const cycleId = params?.id;

  const { data: cycle, isLoading: cycleLoading } = useQuery<Cycle>({
    queryKey: ["/api/cycles", cycleId],
    enabled: !!cycleId,
  });

  const { data: transactions, isLoading: txLoading } = useQuery<(Transaction & { category: Category })[]>({
    queryKey: ["/api/transactions", { cycleId }],
    enabled: !!cycleId,
  });

  const isLoading = cycleLoading || txLoading;

  const totalExpenses = transactions
    ?.filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

  const totalIncome = transactions
    ?.filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

  const currentBalance = cycle
    ? parseFloat(cycle.startingBalance) + totalIncome - totalExpenses
    : 0;

  return (
    <SubPageLayout title="Cycle Details" backPath="/cycles">
      <div className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : cycle ? (
          <>
            <Card className="mb-4 bg-gradient-to-br from-primary to-teal-600 text-white border-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    className={`${
                      cycle.status === "active"
                        ? "bg-white/20 text-white"
                        : "bg-gray-500/20 text-white"
                    } border-0`}
                  >
                    {cycle.status === "active" ? "Active" : "Closed"}
                  </Badge>
                  {cycle.status === "active" && (
                    <span className="text-sm text-white/80">
                      {getDaysRemaining(cycle.nextAllowanceDate)} days remaining
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/80 mb-1">Current Balance</p>
                <p className="text-3xl font-bold" data-testid="text-cycle-balance">
                  {formatCurrency(currentBalance)}
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-xs text-muted-foreground">Income</span>
                  </div>
                  <p className="text-lg font-semibold text-emerald-600">
                    +{formatCurrency(totalIncome)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-xs text-muted-foreground">Expenses</span>
                  </div>
                  <p className="text-lg font-semibold text-red-600">
                    -{formatCurrency(totalExpenses)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Period</p>
                    <p className="text-sm font-medium">
                      {formatDate(cycle.startDate)} - {formatDate(cycle.nextAllowanceDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Starting Balance</p>
                    <p className="text-sm font-medium">{formatCurrency(cycle.startingBalance)}</p>
                  </div>
                </div>
                {cycle.expectedNextAmount && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expected Next</p>
                      <p className="text-sm font-medium">{formatCurrency(cycle.expectedNextAmount)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {transactions && transactions.length > 0 ? (
                  <ScrollArea className="max-h-80">
                    <div className="divide-y divide-border">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                tx.type === "expense"
                                  ? "bg-red-100"
                                  : "bg-emerald-100"
                              }`}
                            >
                              {tx.type === "expense" ? (
                                <ArrowDownRight className="w-5 h-5 text-red-600" />
                              ) : (
                                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{tx.category?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">
                                {tx.note || formatDateTime(tx.occurredAt)}
                              </p>
                            </div>
                          </div>
                          <p
                            className={`font-semibold ${
                              tx.type === "expense"
                                ? "text-red-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {tx.type === "expense" ? "-" : "+"}
                            {formatCurrency(tx.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="p-8 text-center">
                    <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No transactions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Cycle not found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </SubPageLayout>
  );
}
