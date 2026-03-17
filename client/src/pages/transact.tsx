import { Link } from "wouter";
import { ArrowUpRight, Wallet, Receipt, Calendar, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";

const actions = [
  {
    path: "/transact/expense",
    icon: ArrowUpRight,
    label: "Send money",
    description: "Record money you spent",
    bgColor: "bg-gray-50",
    iconBgColor: "bg-white",
    iconColor: "text-gray-600",
    testId: "link-add-expense",
  },
  {
    path: "/transact/income",
    icon: Wallet,
    label: "Deposit into account",
    description: "Record money you received",
    bgColor: "bg-amber-50",
    iconBgColor: "bg-amber-100",
    iconColor: "text-amber-600",
    testId: "link-add-income",
  },
  {
    path: "/categories",
    icon: Receipt,
    label: "Manage categories",
    description: "Add or edit spending categories",
    bgColor: "bg-emerald-50",
    iconBgColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
    testId: "link-categories",
  },
  {
    path: "/history",
    icon: Calendar,
    label: "Transaction history",
    description: "View all your transactions",
    bgColor: "bg-gray-50",
    iconBgColor: "bg-white",
    iconColor: "text-gray-600",
    testId: "link-history",
  },
];

export default function TransactPage() {
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-5 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Transact</h1>
          <p className="text-sm text-muted-foreground">Select a transaction option</p>
        </header>

        <div className="space-y-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.path} href={action.path}>
                <Card 
                  className={`hover-elevate cursor-pointer border-0 shadow-sm ${action.bgColor}`} 
                  data-testid={action.testId}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl ${action.iconBgColor} flex items-center justify-center shadow-sm`}
                    >
                      <Icon className={`w-6 h-6 ${action.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{action.label}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
