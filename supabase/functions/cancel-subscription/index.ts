import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Cancelling subscription for user:", user.id);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user's subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("razorpay_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription?.razorpay_subscription_id) {
      console.error("No active subscription found:", subError);
      return new Response(
        JSON.stringify({ error: "No active subscription found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Razorpay credentials not configured");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cancel subscription in Razorpay
    const cancelResponse = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${subscription.razorpay_subscription_id}/cancel`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cancel_at_cycle_end: 1, // Cancel at the end of current billing cycle
        }),
      }
    );

    if (!cancelResponse.ok) {
      const cancelError = await cancelResponse.text();
      console.error("Failed to cancel Razorpay subscription:", cancelError);
      
      // If already cancelled or in a non-cancellable state, just update DB
      if (!cancelResponse.ok && cancelResponse.status !== 400) {
        return new Response(
          JSON.stringify({ error: "Failed to cancel subscription" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Update subscription in database
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "cancelled",
        plan: "free",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    console.log("Subscription cancelled successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
