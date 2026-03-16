import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing and using StuFi, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.

StuFi is designed for students to manage their personal allowances and track spending. The service is provided "as is" without warranties of any kind.`,
  },
  {
    title: "2. User Accounts",
    content: `You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration and keep your details up to date.

You agree to notify us immediately of any unauthorized access to your account. We reserve the right to suspend accounts that violate our terms.`,
  },
  {
    title: "3. Use of Service",
    content: `StuFi is intended for personal financial tracking only. You may not use the service for:
- Commercial purposes without authorization
- Any illegal or fraudulent activities
- Storing false or misleading financial data
- Attempting to access other users' accounts`,
  },
  {
    title: "4. Data and Privacy",
    content: `Your financial data is stored securely and encrypted. We do not share your personal information with third parties except as required by law.

You retain ownership of your data and can export or delete it at any time through the app settings.`,
  },
  {
    title: "5. Service Availability",
    content: `We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. We may perform maintenance or updates that temporarily affect availability.

We reserve the right to modify or discontinue features with reasonable notice to users.`,
  },
  {
    title: "6. Limitation of Liability",
    content: `StuFi provides budgeting tools and analytics as guidance only. We are not financial advisors and are not liable for financial decisions you make based on our tools.

Our maximum liability is limited to the fees paid for premium features, if any.`,
  },
  {
    title: "7. Changes to Terms",
    content: `We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.

We will notify users of significant changes via email or in-app notification.`,
  },
];

export default function TermsPage() {
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-5 py-6">
        <header className="flex items-center gap-4 mb-6">
          <Link href="/more">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Terms and Conditions</h1>
        </header>

        <Card className="border-0 shadow-sm mb-4 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Last updated: January 2026
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-semibold text-base mb-2">{section.title}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        <Card className="border-0 shadow-sm mt-8 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-center">
              Questions about our terms?{" "}
              <Link href="/contact" className="text-primary font-medium">
                Contact us
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
