import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSubscription } from "@/features/subscriptions";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const features = {
  free: [
    "Track up to 10 applications",
    "Basic analytics",
    "Limited file uploads",
    "Status tracking",
    "Application notes",
  ],
  pro: [
    "Unlimited applications",
    "Full analytics dashboard",
    "Unlimited file uploads",
    "Advanced notifications",
    "Priority support",
    "Timeline history",
  ],
};

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, isPro, createSubscription, confirmSubscription, cancelSubscription } = useSubscription();
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createSubscription.mutateAsync(selectedCycle);
      
      if (!result?.subscription_id || !result?.key_id) {
        throw new Error("Invalid subscription response");
      }

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const options = {
        key: result.key_id,
        subscription_id: result.subscription_id,
        name: "InternTrack",
        description: `Pro ${selectedCycle === "monthly" ? "Monthly" : "Yearly"} Subscription`,
        handler: async (response: any) => {
          try {
            await confirmSubscription.mutateAsync({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
            });
            navigate("/");
          } catch (error) {
            console.error("Error confirming payment:", error);
          }
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Error initiating payment:", error);
      toast.error("Failed to initiate payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (confirm("Are you sure you want to cancel your subscription?")) {
      await cancelSubscription.mutateAsync();
    }
  };

  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(script);
    });
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg">
            Unlock the full potential of InternTrack
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            variant={selectedCycle === "monthly" ? "default" : "outline"}
            onClick={() => setSelectedCycle("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={selectedCycle === "yearly" ? "default" : "outline"}
            onClick={() => setSelectedCycle("yearly")}
          >
            Yearly
            <Badge variant="secondary" className="ml-2">Save 16%</Badge>
          </Button>
        </div>

        {/* Current Plan Badge */}
        {user && subscription && (
          <div className="text-center mb-8">
            <Badge variant={isPro ? "default" : "secondary"} className="text-sm px-4 py-1">
              Current Plan: {isPro ? "Pro" : "Free"}
              {isPro && subscription.billing_cycle && ` (${subscription.billing_cycle})`}
            </Badge>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <Card className={!isPro && user ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Free
              </CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="text-3xl font-bold mt-4">₹0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.free.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {!user ? (
                <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                  Get Started
                </Button>
              ) : !isPro ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={handleCancel} disabled={cancelSubscription.isPending}>
                  {cancelSubscription.isPending ? "Cancelling..." : "Downgrade to Free"}
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className={isPro ? "ring-2 ring-primary" : "border-primary/50"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Pro
                </CardTitle>
                <Badge>Popular</Badge>
              </div>
              <CardDescription>For serious job seekers</CardDescription>
              <div className="text-3xl font-bold mt-4">
                {selectedCycle === "monthly" ? "₹99" : "₹999"}
                <span className="text-sm font-normal text-muted-foreground">
                  /{selectedCycle === "monthly" ? "month" : "year"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.pro.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {!user ? (
                <Button className="w-full" onClick={() => navigate("/auth")}>
                  Get Started
                </Button>
              ) : isPro ? (
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button className="w-full" onClick={handleUpgrade} disabled={isLoading}>
                  {isLoading ? "Processing..." : `Upgrade to Pro`}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button variant="ghost" onClick={() => navigate("/")}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
