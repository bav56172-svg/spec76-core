import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe";
import { supabase } from "@/services/supabase";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid webhook" },
      { status: 400 }
    );
  }

  /**
   * 🟢 SUBSCRIPTION CREATED
   */
  if (event.type === "checkout.session.completed") {
    const session: any = event.data.object;

    const userId = session.metadata.userId;
    const plan = session.metadata.plan;

    await supabase.from("billing").upsert({
      user_id: userId,
      plan,
      status: "active",
      updated_at: new Date(),
    });
  }

  /**
   * 🟢 SUBSCRIPTION UPDATED
   */
  if (event.type === "customer.subscription.updated") {
    const subscription: any = event.data.object;

    await supabase.from("billing").update({
      status: subscription.status,
    });
  }

  /**
   * 🟢 SUBSCRIPTION DELETED
   */
  if (event.type === "customer.subscription.deleted") {
    const subscription: any = event.data.object;

    await supabase.from("billing").update({
      status: "canceled",
      plan: "free",
    });
  }

  return NextResponse.json({ received: true });
}