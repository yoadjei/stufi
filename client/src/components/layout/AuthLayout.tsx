// auth pages layout — blue header, stufi branding
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="relative overflow-hidden pt-12 pb-20">
        <div className="absolute inset-0 stufi-gradient-hero" />
        <div className="relative z-10 flex flex-col items-center px-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white">
              <img src="/icon.png" alt="StuFi Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">StuFi</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          {subtitle && <p className="text-blue-100 text-sm">{subtitle}</p>}
        </div>
      </div>

      <div className="flex-1 -mt-8 bg-white rounded-t-3xl px-6 py-8 relative z-20">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </div>

      <div className="bg-white py-4 text-center">
        <p className="text-xs text-muted-foreground">
          <a href="/contact" className="hover:underline">Contact us</a>
          {" | "}
          <a href="/terms" className="hover:underline">Terms and conditions</a>
        </p>
      </div>
    </div>
  );
}
