// app layout — sidebar nav for desktop, full-width content
import { useLocation, Link } from "wouter";
import { Home, Wallet, ArrowRightLeft, BarChart3, Menu, LogOut } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/cycles", icon: Wallet, label: "Budget" },
  { path: "/transact", icon: ArrowRightLeft, label: "Transact" },
  { path: "/insights", icon: BarChart3, label: "Insights" },
  { path: "/more", icon: Menu, label: "More" },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  useEffect(() => {
    const activeItem = navItems.find((item) => isActive(item.path));
    if (activeItem) {
      document.title = `${activeItem.label} | StuFi`;
    } else {
      document.title = "StuFi";
    }
  }, [location]);

  const firstName = user?.name?.split(" ")[0] || "Student";

  return (
    <div className="min-h-screen bg-background flex">
      {/* sidebar */}
      <aside className="hidden md:flex w-56 flex-col fixed inset-y-0 left-0 bg-[hsl(220,55%,22%)] text-white z-40">
        {/* logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white">
            <img src="/icon.png" alt="StuFi Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg font-bold tracking-tight">StuFi</span>
        </div>

        {/* nav links */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${active
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* user + logout */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-white/70">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold text-white">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate">{firstName}</span>
            <button
              onClick={logout}
              className="text-white/40 hover:text-white transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* main content */}
      <main className="flex-1 md:ml-56 min-h-screen">
        {/* mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md overflow-hidden bg-white flex items-center justify-center">
              <img src="/icon.png" alt="StuFi Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-base font-bold text-gray-900">StuFi</span>
          </div>
        </div>

        <div className="pb-20 md:pb-0">
          {children}
        </div>

        {/* mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50" data-testid="nav-bottom">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} href={item.path} data-testid={`nav-${item.label.toLowerCase()}`}>
                  <div className="flex flex-col items-center justify-center min-w-[56px] py-1 transition-all relative">
                    {active && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
                    )}
                    <Icon className={`w-5 h-5 ${active ? "text-primary stroke-[2.5]" : "text-gray-400 stroke-[1.5]"}`} />
                    <span className={`text-[10px] mt-1 ${active ? "text-primary font-semibold" : "text-gray-400"}`}>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
