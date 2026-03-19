import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export function SubPageLayout({ children, title, backPath, rightAction }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = `${title} | StuFi`;
  }, [title]);

  const handleBack = () => {
    // If there is history (length > 2 usually means they've browsed in the app)
    // we go back to exactly where they came from (e.g. Home screen)
    if (window.history.length > 2) {
      window.history.back();
    } else if (backPath) {
      setLocation(backPath);
    } else {
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1 text-center">{title}</h1>
          <div className="w-9">{rightAction}</div>
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
