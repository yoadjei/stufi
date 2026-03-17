import { useQuery } from "@tanstack/react-query";
import { Download, FileText, FileJson, Calendar } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiBase } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { formatDate } from "@/lib/api";
import type { Cycle } from "@shared/schema";

export default function ExportPage() {
  const { toast } = useToast();
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: cycles, isLoading } = useQuery<Cycle[]>({
    queryKey: ["/api/cycles"],
  });

  const handleExport = async (format: "csv" | "json") => {
    if (!selectedCycle) {
      toast({
        title: "Select a Cycle",
        description: "Please select a cycle to export.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(`${apiBase}/api/export/${format}?cycleId=${selectedCycle}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${selectedCycle}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Export Complete", description: `Your ${format.toUpperCase()} file is ready.` });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const selectedCycleData = cycles?.find((c) => c.id === selectedCycle);

  return (
    <SubPageLayout title="Export Data" backPath="/more">
      <div className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : (
          <>
            <Card className="mb-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Select Cycle
                </CardTitle>
                <CardDescription className="text-xs">
                  Choose which spending cycle to export
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                  <SelectTrigger data-testid="select-cycle">
                    <SelectValue placeholder="Select a cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {cycles?.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {formatDate(cycle.startDate)} - {formatDate(cycle.nextAllowanceDate)}
                        {cycle.status === "active" && " (Active)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedCycleData && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium">
                      {formatDate(selectedCycleData.startDate)} - {formatDate(selectedCycleData.nextAllowanceDate)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Status: {selectedCycleData.status === "active" ? "Active" : "Closed"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Format
                </CardTitle>
                <CardDescription className="text-xs">
                  Download your transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-14 justify-start"
                  onClick={() => handleExport("csv")}
                  disabled={!selectedCycle || isDownloading}
                  data-testid="button-export-csv"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">CSV Format</p>
                      <p className="text-xs text-muted-foreground">
                        Compatible with Excel, Google Sheets
                      </p>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-14 justify-start"
                  onClick={() => handleExport("json")}
                  disabled={!selectedCycle || isDownloading}
                  data-testid="button-export-json"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileJson className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">JSON Format</p>
                      <p className="text-xs text-muted-foreground">
                        For developers and data analysis
                      </p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {cycles?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No cycles available to export. Create a spending cycle first.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </SubPageLayout>
  );
}
