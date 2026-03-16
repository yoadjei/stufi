import { Link } from "wouter";
import { ChevronLeft, Shield, Lock, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";

const highlights = [
  {
    icon: Lock,
    title: "Encrypted Data",
    description: "All your financial data is encrypted in transit and at rest",
  },
  {
    icon: Eye,
    title: "Your Data, Your Control",
    description: "Export or delete your data anytime from settings",
  },
  {
    icon: Trash2,
    title: "Right to Delete",
    description: "Request complete account deletion at any time",
  },
];

const sections = [
  {
    title: "Information We Collect",
    content: `When you use StuFi, we collect:
- Account information: email, name, phone (optional), academic details
- Financial data: transactions, categories, spending cycles you create
- Usage data: app interactions, feature usage for improving our service
- Device information: device type and operating system for compatibility`,
  },
  {
    title: "How We Use Your Data",
    content: `We use your information to:
- Provide and maintain the StuFi service
- Calculate analytics, predictions, and spending insights
- Send notifications about your spending and account activity
- Improve our features based on usage patterns
- Communicate important updates and security alerts`,
  },
  {
    title: "Data Storage and Security",
    content: `Your data is stored on secure servers with industry-standard encryption. We use:
- SSL/TLS encryption for all data transmission
- Encrypted database storage for sensitive information
- Regular security audits and updates
- Strict access controls for our team`,
  },
  {
    title: "Data Sharing",
    content: `We do NOT sell your personal data. We may share data only:
- With your explicit consent
- To comply with legal requirements
- With service providers who help us operate (under strict agreements)
- In anonymized, aggregated form for research`,
  },
  {
    title: "Your Rights",
    content: `You have the right to:
- Access all data we have about you
- Export your data in standard formats (CSV, JSON)
- Correct inaccurate information
- Delete your account and all associated data
- Opt out of non-essential communications`,
  },
  {
    title: "Cookies and Tracking",
    content: `We use essential cookies to keep you logged in and remember your preferences. We do not use third-party advertising trackers.

You can manage cookie preferences in your browser settings.`,
  },
  {
    title: "Children's Privacy",
    content: `StuFi is designed for university students (18+). We do not knowingly collect data from users under 18. If you believe a minor has created an account, please contact us.`,
  },
  {
    title: "Changes to This Policy",
    content: `We may update this policy to reflect changes in our practices or legal requirements. We will notify you of significant changes via email or in-app notification.`,
  },
];

export default function PrivacyPage() {
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-5 py-6">
        <header className="flex items-center gap-4 mb-6">
          <Link href="/more">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Privacy Policy</h1>
        </header>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Your Privacy Matters</h2>
          <p className="text-sm text-muted-foreground">
            We're committed to protecting your personal and financial data.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-8">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-0 shadow-sm mb-6 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Last updated: March 2026
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
              Privacy questions?{" "}
              <Link href="/contact" className="text-primary font-medium">
                Contact our team
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
