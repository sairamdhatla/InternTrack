import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";

export interface Subscription {
  id: string;
  user_id: string;
  plan: "free" | "pro";
  billing_cycle: "monthly" | "yearly" | null;
  status: "active" | "cancelled" | "expired";
  razorpay_subscription_id: string | null;
  start_date: string;
  end_date: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        return null;
      }

      return data as Subscription | null;
    },
    enabled: !!user,
  });

  const isPro = subscription?.plan === "pro" && subscription?.status === "active";
  const plan = subscription?.plan ?? "free";
  const billingCycle = subscription?.billing_cycle;

  const createSubscription = useMutation({
    mutationFn: async (billingCycle: "monthly" | "yearly") => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("create-subscription", {
        body: { billing_cycle: billingCycle },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create subscription");
      }

      return response.data;
    },
    onError: (error) => {
      console.error("Error creating subscription:", error);
      toast.error("Failed to initiate subscription");
    },
  });

  const confirmSubscription = useMutation({
    mutationFn: async (paymentData: {
      razorpay_payment_id: string;
      razorpay_subscription_id: string;
      razorpay_signature: string;
    }) => {
      const response = await supabase.functions.invoke("confirm-subscription", {
        body: paymentData,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to confirm subscription");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Subscription activated successfully!");
    },
    onError: (error) => {
      console.error("Error confirming subscription:", error);
      toast.error("Failed to confirm subscription");
    },
  });

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke("cancel-subscription");

      if (response.error) {
        throw new Error(response.error.message || "Failed to cancel subscription");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Subscription cancelled");
    },
    onError: (error) => {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription");
    },
  });

  return {
    subscription,
    isLoading,
    isPro,
    plan,
    billingCycle,
    createSubscription,
    confirmSubscription,
    cancelSubscription,
  };
};
