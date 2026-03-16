// dashboard — the main home view after login
// full-width layout with blue header, balance card, quick actions, transactions
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Bell,
  Eye,
  EyeOff,
  Minus,
  Plus,
  RefreshCw,
  BarChart3,
  ChevronRight,
  Wallet,
  Headphones,
  Gift,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/api";
import type { AnalyticsSummary, Cycle, Notification, Transaction } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);

  const { data: currentCycle, isLoading: cycleLoading } = useQuery<Cycle>({
    queryKey: ["/api/cycles/current"],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary"],
    enabled: !!currentCycle,
  });

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: !!currentCycle,
  });

  const recentTransactions = transactions?.slice(0, 5) || [];
  const unreadCount = notifications?.filter((n) => !n.readAt).length || 0;
  const isLoading = cycleLoading || analyticsLoading;

  const firstName = user?.name?.split(" ")[0] || "Student";

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        {/* blue header */}
        <div className="stufi-gradient-hero px-6 md:px-10 pt-8 pb-20">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-xl font-medium text-blue-100" data-testid="text-greeting">
                  Welcome back,
                </h1>
                <h2 className="text-3xl font-bold text-white">{firstName}</h2>
              </div>
              <Link href="/notifications">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/15 text-white rounded-full relative hover:bg-white/25"
                  data-testid="button-notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center" data-testid="badge-unread-count">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* content */}
        <div className="relative -mt-12 px-6 md:px-10 flex-1">
          <div className="max-w-5xl mx-auto">
            {/* balance card */}
            {!currentCycle && !cycleLoading ? (
              <Card className="mb-6 shadow-lg border-0 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Start Your First Budget</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create a budget cycle to start tracking your allowance and spending.
                      </p>
                      <Link href="/cycles/new">
                        <Button className="rounded-lg px-6" data-testid="button-new-cycle-cta">
                          Create Budget
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6 shadow-lg border-0 bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Available balance</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => setHideBalance(!hideBalance)}
                      data-testid="button-toggle-balance"
                    >
                      {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-10 w-40 mb-2" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground mb-2" data-testid="text-balance">
                      {hideBalance ? "GHS ••••••" : formatCurrency(analytics?.currentBalance || "0")}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{analytics?.daysLeft || 0} days left</span>
                    <span className="text-primary font-medium">
                      {hideBalance ? "••••" : formatCurrency(analytics?.safePerDay || "0")}/day
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* quick actions — grid */}
            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/transact/expense">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border border-gray-100 bg-white">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                        <Minus className="w-5 h-5 text-red-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-700" data-testid="tile-add-expense">Add Expense</span>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/transact/income">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border border-gray-100 bg-white">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-gray-700" data-testid="tile-add-income">Add Income</span>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/cycles/new">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border border-gray-100 bg-white">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-green-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-700" data-testid="tile-new-cycle">New Budget</span>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/insights">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border border-gray-100 bg-white">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-gray-700" data-testid="tile-insights">View Insights</span>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </section>

            {/* two-column layout on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* recent transactions */}
              {recentTransactions.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                    <Link href="/history">
                      <span className="text-sm text-primary font-medium">See all</span>
                    </Link>
                  </div>
                  <Card className="border border-gray-100 shadow-sm bg-white">
                    <CardContent className="p-0">
                      {recentTransactions.map((tx, index) => (
                        <div
                          key={tx.id}
                          className={`flex items-center gap-3 p-4 ${index < recentTransactions.length - 1 ? 'border-b border-gray-50' : ''}`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'expense'
                            ? 'bg-red-50'
                            : 'bg-blue-50'
                            }`}>
                            {tx.type === 'expense' ? (
                              <ArrowUpRight className="w-5 h-5 text-red-500" />
                            ) : (
                              <ArrowDownLeft className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-gray-800">{tx.note || (tx.type === 'expense' ? 'Expense' : 'Income')}</p>
                            <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                          </div>
                          <p className={`text-sm font-semibold ${tx.type === 'expense' ? 'text-red-500' : 'text-primary'
                            }`}>
                            {tx.type === 'expense' ? '-' : '+'}{hideBalance ? '••••' : formatCurrency(tx.amount)}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* explore + insights */}
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Explore</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/contact">
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border border-gray-100 bg-white">
                        <CardContent className="p-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                            <Headphones className="w-5 h-5 text-primary" />
                          </div>
                          <p className="text-sm font-medium text-gray-800 mb-1">Contact Us</p>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </CardContent>
                      </Card>
                    </Link>
                    <Link href="/refer">
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border border-gray-100 bg-white">
                        <CardContent className="p-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                            <Gift className="w-5 h-5 text-primary" />
                          </div>
                          <p className="text-sm font-medium text-gray-800 mb-1">Refer & Earn</p>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </section>

                {analytics && currentCycle && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">Insights</h3>
                      <Link href="/insights">
                        <span className="text-sm text-primary font-medium">See all</span>
                      </Link>
                    </div>
                    <Link href="/insights">
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border border-gray-100 bg-white">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-800">Survival forecast</p>
                            <p className="text-xs text-gray-400">See how your spending impacts your budget</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </CardContent>
                      </Card>
                    </Link>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
