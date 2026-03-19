import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Loader2,
  UtensilsCrossed,
  Bus,
  Wifi,
  BookOpen,
  Shirt,
  ShowerHead,
  Gamepad2,
  HeartPulse,
  Home,
  Music,
  Tags,
  TrendingUp,
  Gift,
  RotateCcw,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { apiRequest } from "@/lib/api";

// Map category names to meaningful icons
const CATEGORY_ICONS = {
  "Food": UtensilsCrossed,
  "Transport": Bus,
  "Data & Airtime": Wifi,
  "Books & Supplies": BookOpen,
  "Clothing": Shirt,
  "Toiletries": ShowerHead,
  "Entertainment": Gamepad2,
  "Health": HeartPulse,
  "Rent": Home,
  "Fun": Music,
  "Allowance": TrendingUp,
  "Gift": Gift,
  "Refund": RotateCcw,
  "Other Income": CircleDollarSign,
};

function getCategoryIcon(name) {
  return CATEGORY_ICONS[name] || Tags;
}

export default function CategoriesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("expense");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/categories", data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to create category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category Created", description: "New category has been added." });
      setIsOpen(false);
      setName("");
      setKind("expense");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiRequest("DELETE", `/api/categories/${id}`);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to delete");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category Archived", description: "Category has been removed." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), kind });
  };

  const expenseCategories = categories?.filter((c) => c.kind === "expense" && !c.archivedAt) || [];
  const incomeCategories = categories?.filter((c) => c.kind === "income" && !c.archivedAt) || [];
  const bothCategories = categories?.filter((c) => c.kind === "both" && !c.archivedAt) || [];

  const CategoryList = ({ cats, title }) => (
    cats.length > 0 && (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {cats.map((category) => {
              const Icon = getCategoryIcon(category.name);
              return (
                <div key={category.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{category.name}</p>
                      {category.isDefault && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">Default</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  {!category.isDefault && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          data-testid={`button-delete-${category.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Archive Category</AlertDialogTitle>
                          <AlertDialogDescription>
                            This category will be archived and won't appear in new transactions.
                            Existing transactions will keep this category.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(category.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Archive
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    )
  );

  return (
    <SubPageLayout
      title="Categories"
      backPath="/transact"
      rightAction={
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-add-category">
              <Plus className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input
                  placeholder="e.g., Groceries"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-category-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={kind} onValueChange={(v) => setKind(v)}>
                  <SelectTrigger data-testid="select-category-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={createMutation.isPending || !name.trim()}
                data-testid="button-create-category"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Category"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : (
          <>
            <CategoryList cats={expenseCategories} title="Expense Categories" />
            <CategoryList cats={incomeCategories} title="Income Categories" />
            <CategoryList cats={bothCategories} title="Expense & Income" />

            {categories?.length === 0 && (
              <Card className="border-dashed border-2">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Tags className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No Categories</h3>
                  <p className="text-sm text-muted-foreground">
                    Add categories to organize your transactions.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </SubPageLayout>
  );
}
