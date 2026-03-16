import { Link } from "wouter";
import { User, Key, Settings, FileText, Bell, LogOut, ChevronRight, CheckCircle2, Gift, MessageCircle, FileCheck, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/auth";

const accountItems = [
  {
    path: "/more/profile",
    icon: User,
    label: "Personal details",
    description: "View your personal information",
    testId: "link-profile",
  },
  {
    path: "/more/security",
    icon: Key,
    label: "Security details",
    description: "Change your password",
    testId: "link-security",
  },
  {
    path: "/more/cap",
    icon: Settings,
    label: "Account settings",
    description: "Manage spending limits",
    testId: "link-daily-cap",
  },
  {
    path: "/more/export",
    icon: FileText,
    label: "Export data",
    description: "Download your transactions",
    testId: "link-export",
  },
  {
    path: "/notifications",
    icon: Bell,
    label: "Notifications",
    description: "Manage your notifications",
    testId: "link-notifications",
  },
];

const otherItems = [
  {
    path: "/refer",
    icon: Gift,
    label: "Refer and Earn",
    description: "Invite friends and get rewards",
    testId: "link-refer",
  },
  {
    path: "/contact",
    icon: MessageCircle,
    label: "Contact Us",
    description: "Get help from our team",
    testId: "link-contact",
  },
  {
    path: "/terms",
    icon: FileCheck,
    label: "Terms and Conditions",
    description: "Read our terms of service",
    testId: "link-terms",
  },
  {
    path: "/privacy",
    icon: Shield,
    label: "Privacy Policy",
    description: "How we protect your data",
    testId: "link-privacy",
  },
];

export default function MorePage() {
  const { user, logout } = useAuth();

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 affinity-gradient-hero" />
          <div className="absolute top-4 right-0 w-40 h-40 bg-orange-400/40 rounded-full blur-2xl" />
          <div className="absolute top-20 right-10 w-28 h-28 bg-yellow-400/50 rounded-full blur-xl" />

          <div className="relative z-10 px-5 pt-8 pb-16 flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="w-24 h-24 border-4 border-white/20">
                <AvatarFallback className="bg-white text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-primary" style={{ textShadow: "0 1px 4px rgba(255,255,255,0.6)" }} data-testid="text-user-name">
                {user?.name || "User"}
              </h1>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="flex-1 -mt-6 bg-white rounded-t-3xl relative z-20">
          <div className="max-w-lg mx-auto px-5 py-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Account</h2>
            <Card className="border-0 shadow-sm mb-6">
              <CardContent className="p-0">
                {accountItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.path}>
                      <Link href={item.path}>
                        <div className="flex items-center gap-4 p-4 hover-elevate cursor-pointer" data-testid={item.testId}>
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </Link>
                      {index < accountItems.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <h2 className="text-sm font-medium text-muted-foreground mb-3">More</h2>
            <Card className="border-0 shadow-sm mb-6">
              <CardContent className="p-0">
                {otherItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.path}>
                      <Link href={item.path}>
                        <div className="flex items-center gap-4 p-4 hover-elevate cursor-pointer" data-testid={item.testId}>
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </Link>
                      {index < otherItems.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex flex-col items-center mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <span className="font-semibold">StuFi</span>
              </div>
              <p className="text-xs text-muted-foreground">Version 1.0.0</p>
            </div>

            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/30"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
