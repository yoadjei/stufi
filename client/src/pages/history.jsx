import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Trash2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { formatCurrency, formatDateTime, apiRequest } from "@/lib/api";

export default function HistoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiRequest("DELETE", `/api/transactions/${id}`);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to delete");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      toast({ title: "Deleted", description: "Transaction has been removed." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const groupedTransactions = transactions?.reduce((groups, tx) => {
    const date = new Date(tx.occurredAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(tx);
    return groups;
  }, {});

  return (
    <SubPageLayout title="Transaction History" backPath="/transact">
      <div className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-6 w-32 mt-4" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedTransactions || {}).map(([date, txs]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
                <Card>
                  <CardContent className="p-0 divide-y divide-border">
                    {txs?.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${
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
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {tx.category?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {tx.note || formatDateTime(tx.occurredAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                data-testid={`button-delete-${tx.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this transaction? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(tx.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No Transactions Yet</h3>
              <p className="text-sm text-muted-foreground">
                Your transaction history will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </SubPageLayout>
  );
}
