import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ChevronLeft,
  Calculator,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency } from "@/lib/api";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const COLORS = ["#4ecdc4", "#f4a460", "#9b59b6", "#27ae60", "#3498db", "#e74c3c"];

export default function InsightsPage() {
  const { data: currentCycle, isLoading: cycleLoading } = useQuery({
    queryKey: ["/api/cycles/current"],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics/summary"],
    enabled: !!currentCycle,
  });

  const { data: timeseries, isLoading: timeseriesLoading } = useQuery({
    queryKey: ["/api/analytics/timeseries"],
    enabled: !!currentCycle,
  });

  const isLoading = cycleLoading || analyticsLoading || timeseriesLoading;

  const monthlyData = timeseries?.reduce((acc, d) => {
    const month = new Date(d.date).toLocaleDateString("en-US", { month: "short" });
    const existing = acc.find(m => m.month === month);
    if (existing) {
      existing.income += parseFloat(d.incomeTotal);
      existing.expense += parseFloat(d.expenseTotal);
    } else {
      acc.push({
        month,
        income: parseFloat(d.incomeTotal),
        expense: parseFloat(d.expenseTotal),
      });
    }
    return acc;
  }, []) || [];

  const pieData = analytics?.categoryTotals
    .filter((c) => parseFloat(c.total) > 0)
    .map((c, i) => ({
      name: c.categoryName,
      value: parseFloat(c.total),
      fill: COLORS[i % COLORS.length],
    })) || [];

  const totalSpent = pieData.reduce((sum, d) => sum + d.value, 0);
  const totalIncome = timeseries?.reduce((sum, d) => sum + parseFloat(d.incomeTotal), 0) || 0;
  const totalExpense = timeseries?.reduce((sum, d) => sum + parseFloat(d.expenseTotal), 0) || 0;

  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long" });

  if (!currentCycle && !cycleLoading) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-5 py-6">
          <header className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Insights</h1>
          </header>

          <Card className="border-dashed border-2 mb-6">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Start Tracking to See Insights</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a budget and add some transactions to unlock powerful spending analytics.
              </p>
              <Link href="/cycles/new">
                <Button className="rounded-full" data-testid="button-create-budget">
                  Create Budget
                </Button>
              </Link>
            </CardContent>
          </Card>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">What You'll See</h2>
            <div className="space-y-3">
              <Card className="border-0 shadow-sm bg-gray-50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Spending Breakdown</p>
                    <p className="text-xs text-muted-foreground">See where your money goes by category</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gray-50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Transaction Patterns</p>
                    <p className="text-xs text-muted-foreground">Weekly money in vs money out trends</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gray-50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Survival Forecast</p>
                    <p className="text-xs text-muted-foreground">Will your allowance last the month?</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </AppLayout>
    );
  }

  const hasData = totalSpent > 0 || totalIncome > 0;

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-5 py-6">
        <header className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">{currentMonth} Dashboard</h1>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : !hasData ? (
          /* ── active cycle but no transactions yet ── */
          <>
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Saving Trends</h2>
              <Card className="border-0 shadow-sm bg-primary/5">
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-medium text-sm mb-1">No transactions yet</p>
                  <p className="text-xs text-muted-foreground">
                    Start logging your spending to see your saving trends here.
                  </p>
                </CardContent>
              </Card>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Spending Habits</h2>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                    <PieChartIcon className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="font-medium text-sm mb-1">Nothing to show yet</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Your spending breakdown will appear here once you add some expenses.
                  </p>
                  <Link href="/transact/expense">
                    <Button size="sm" className="rounded-full">
                      Add your first expense
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </section>

            <Card className="border-0 shadow-sm bg-amber-50">
              <CardContent className="p-4">
                <p className="text-sm text-center text-amber-800">
                  💡 Tip: Log expenses as you spend — the insights get smarter over time.
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          /* ── has transaction data ── */
          <>
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Saving Trends</h2>
              <Card className="border-0 shadow-sm bg-gray-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Your savings increased by:</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(Math.max(0, totalIncome - totalExpense))}
                    </p>
                  </div>
                  <div className="w-16 h-16 flex items-center justify-center">
                    <Calculator className="w-12 h-12 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Spending Habits</h2>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex gap-4 mb-4 border-b pb-2">
                    <span className="text-sm font-medium text-primary border-b-2 border-primary pb-2 -mb-2 cursor-pointer" data-testid="tab-category">
                      By Category
                    </span>
                    <span className="text-sm font-medium text-muted-foreground pb-2 -mb-2 cursor-pointer" data-testid="tab-service">
                      By Service
                    </span>
                  </div>

                  {pieData.length > 0 ? (
                    <div className="flex flex-col items-center">
                      <div className="relative w-48 h-48 mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-xs text-muted-foreground">GHS</p>
                          <p className="text-lg font-bold">{totalSpent.toLocaleString("en-GH", { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mb-4">
                        {pieData.slice(0, 2).map((entry) => (
                          <div key={entry.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                            <span className="text-sm">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No spending data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {pieData.length > 0 && (
              <section className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Your Top Categories</h2>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    {pieData.slice(0, 5).map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                          <span className="text-sm">
                            {entry.name} ({((entry.value / totalSpent) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(entry.value)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>
            )}

            {monthlyData.length > 0 && (
              <section className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Transaction Pattern</h2>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-6 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-sm">Money In</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-700" />
                        <span className="text-sm">Money Out</span>
                      </div>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} barGap={4}>
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10 }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Bar dataKey="income" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expense" fill="#6b21a8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            <Card className="border-0 shadow-sm bg-amber-50">
              <CardContent className="p-4">
                <p className="text-sm text-center">
                  This {currentMonth}, you deposited <strong>{formatCurrency(totalIncome)}</strong> and spent{" "}
                  <strong>{formatCurrency(totalExpense)}</strong>
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
