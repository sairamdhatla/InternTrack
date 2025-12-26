import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!webhookSecret) {
      console.error("Razorpay webhook secret not configured");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify webhook signature
    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const event = JSON.parse(body);
    console.log("Received Razorpay webhook event:", event.event);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = event.payload;

    switch (event.event) {
      case "subscription.authenticated":
      case "subscription.activated": {
        const subscription = payload.subscription?.entity;
        if (!subscription) break;

        console.log("Activating subscription:", subscription.id);

        // Calculate end date based on billing cycle
        const currentPeriodEnd = subscription.current_end
          ? new Date(subscription.current_end * 1000).toISOString()
          : null;

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            plan: "pro",
            status: "active",
            start_date: new Date().toISOString(),
            end_date: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_subscription_id", subscription.id);

        if (error) {
          console.error("Failed to update subscription:", error);
        } else {
          console.log("Subscription activated successfully");
        }
        break;
      }

      case "subscription.charged": {
        const subscription = payload.subscription?.entity;
        if (!subscription) break;

        console.log("Subscription charged:", subscription.id);

        const currentPeriodEnd = subscription.current_end
          ? new Date(subscription.current_end * 1000).toISOString()
          : null;

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "active",
            end_date: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_subscription_id", subscription.id);
        break;
      }

      case "subscription.pending": {
        const subscription = payload.subscription?.entity;
        if (!subscription) break;

        console.log("Subscription pending:", subscription.id);

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "active", // Keep as active during pending
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_subscription_id", subscription.id);
        break;
      }

      case "subscription.halted":
      case "subscription.cancelled": {
        const subscription = payload.subscription?.entity;
        if (!subscription) break;

        console.log("Subscription cancelled/halted:", subscription.id);

        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan: "free",
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_subscription_id", subscription.id);
        break;
      }

      case "subscription.completed":
      case "subscription.expired": {
        const subscription = payload.subscription?.entity;
        if (!subscription) break;

        console.log("Subscription expired/completed:", subscription.id);

        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan: "free",
            status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_subscription_id", subscription.id);
        break;
      }

      default:
        console.log("Unhandled event type:", event.event);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
