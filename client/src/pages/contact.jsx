import { Link } from "wouter";
import { useState } from "react";
import { ChevronLeft, Mail, Phone, MessageCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const contactMethods = [
  {
    icon: Mail,
    label: "Email Us",
    value: "support@stufi.app",
    description: "Get a response within 24 hours",
    href: "mailto:adjeioseiyaw1@gmail.com",
  },
  {
    icon: Phone,
    label: "Call Us",
    value: "+233 30 123 4567",
    description: "Mon-Fri, 9am-5pm GMT",
    href: "tel:+233301234567",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+233 20 123 4567",
    description: "Quick support via chat",
    href: "https://wa.me/233201234567",
  },
];

export default function ContactPage() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in both the subject and message.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    // Open mailto with pre-filled data
    const mailtoUrl = `mailto:adjeioseiyaw1@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(mailtoUrl, "_blank");

    // Short delay for UX, then show success
    await new Promise((r) => setTimeout(r, 500));

    toast({
      title: "Message Prepared",
      description: "Your email client has been opened with the message. Send it to complete.",
    });

    setSubject("");
    setMessage("");
    setIsSending(false);
  };

  return (
    <SubPageLayout title="Contact Us" backPath={isAuthenticated ? "/more" : "/login"}>
      <div className="max-w-lg mx-auto px-5 py-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">We're Here to Help</h2>
          <p className="text-sm text-muted-foreground">
            Have questions or need assistance? Reach out to our support team.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {contactMethods.map((method) => {
            const Icon = method.icon;
            return (
              <a key={method.label} href={method.href} target="_blank" rel="noopener noreferrer">
                <Card className="hover-elevate cursor-pointer border-0 shadow-sm" data-testid={`link-${method.label.toLowerCase().replace(" ", "-")}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{method.label}</p>
                      <p className="text-sm text-primary">{method.value}</p>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>

        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4">Send Us a Message</h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="What's this about?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  data-testid="input-subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue or question..."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  data-testid="input-message"
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-full"
                disabled={isSending}
                data-testid="button-send-message"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Support Hours</p>
              <p className="text-xs text-muted-foreground">
                Monday - Friday: 9:00 AM - 5:00 PM GMT<br />
                Saturday: 10:00 AM - 2:00 PM GMT<br />
                Sunday: Closed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SubPageLayout>
  );
}
