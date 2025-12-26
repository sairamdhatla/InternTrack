import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateSubscriptionRequest {
  plan_id: string;
  billing_cycle: "monthly" | "yearly";
}

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

    console.log("Creating subscription for user:", user.id);

    const { billing_cycle }: CreateSubscriptionRequest = await req.json();

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID")?.trim();
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET")?.trim();

    console.log("Razorpay Key ID prefix:", razorpayKeyId?.substring(0, 8));
    console.log("Razorpay Key ID length:", razorpayKeyId?.length);
    console.log("Razorpay Secret length:", razorpayKeySecret?.length);

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Razorpay credentials not configured");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Razorpay plan IDs (these should be pre-created in Razorpay dashboard)
    // For test mode, we'll create subscriptions directly
    const amount = billing_cycle === "monthly" ? 9900 : 99900; // in paise
    const period = billing_cycle === "monthly" ? "monthly" : "yearly";

    // First, create a plan in Razorpay
    const planResponse = await fetch("https://api.razorpay.com/v1/plans", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        period: period,
        interval: 1,
        item: {
          name: `InternTrack Pro ${billing_cycle === "monthly" ? "Monthly" : "Yearly"}`,
          amount: amount,
          currency: "INR",
          description: `InternTrack Pro subscription - ${billing_cycle}`,
        },
      }),
    });

    if (!planResponse.ok) {
      const planError = await planResponse.text();
      console.error("Failed to create Razorpay plan:", planError);
      return new Response(
        JSON.stringify({ error: "Failed to create subscription plan" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const plan = await planResponse.json();
    console.log("Created Razorpay plan:", plan.id);

    // Create subscription
    const subscriptionResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: plan.id,
        total_count: billing_cycle === "monthly" ? 12 : 5, // 12 months or 5 years max
        customer_notify: 0,
        notes: {
          user_id: user.id,
        },
      }),
    });

    if (!subscriptionResponse.ok) {
      const subError = await subscriptionResponse.text();
      console.error("Failed to create Razorpay subscription:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to create subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subscription = await subscriptionResponse.json();
    console.log("Created Razorpay subscription:", subscription.id);

    // Store pending subscription in database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user already has a subscription
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingSub) {
      // Update existing subscription
      await supabaseAdmin
        .from("subscriptions")
        .update({
          razorpay_subscription_id: subscription.id,
          billing_cycle: billing_cycle,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } else {
      // Create new subscription record
      await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan: "free", // Will be updated to 'pro' after payment confirmation
          billing_cycle: billing_cycle,
          status: "active",
          razorpay_subscription_id: subscription.id,
        });
    }

    return new Response(
      JSON.stringify({
        subscription_id: subscription.id,
        short_url: subscription.short_url,
        key_id: razorpayKeyId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
