import { Link } from "wouter";
import { ChevronLeft, Gift, Users, Copy, Share2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const rewards = [
  { step: 1, title: "Share your code", description: "Send your unique referral code to friends" },
  { step: 2, title: "Friend signs up", description: "They create an account using your code" },
  { step: 3, title: "Both get rewarded", description: "You both receive bonus when they start a cycle" },
];

export default function ReferPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.id?.slice(0, 8).toUpperCase() || "STUFI000";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "Join StuFi",
      text: `Use my referral code ${referralCode} to sign up for StuFi and we both get rewarded!`,
      url: "https://stufi.app",
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopy();
      }
    } catch (err) {
      console.log("Share cancelled");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-5 py-6">
        <header className="flex items-center gap-4 mb-6">
          <Link href="/more">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Refer and Earn</h1>
        </header>

        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Invite Friends, Earn Rewards</h2>
          <p className="text-sm text-muted-foreground">
            Share StuFi with your classmates and both of you get bonus credits!
          </p>
        </div>

        <Card className="border-0 shadow-sm mb-6 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-2 text-center">Your referral code</p>
            <div className="flex items-center gap-2">
              <Input
                value={referralCode}
                readOnly
                className="text-center text-xl font-bold tracking-widest bg-white"
                data-testid="input-referral-code"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                data-testid="button-copy-code"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full rounded-full mb-8"
          onClick={handleShare}
          data-testid="button-share"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share with Friends
        </Button>

        <section className="mb-8">
          <h3 className="font-semibold mb-4">How it works</h3>
          <div className="space-y-4">
            {rewards.map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold">Your Referrals</p>
                <p className="text-sm text-muted-foreground">Friends who joined using your code</p>
              </div>
            </div>
            <div className="text-center py-6 border-t">
              <p className="text-3xl font-bold text-primary mb-1">0</p>
              <p className="text-sm text-muted-foreground">Successful referrals</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
