import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripeClient, getStripeWebhookSecret } from "@/lib/billing/stripe";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type BillingCustomer = {
  id: string;
  user_id: string;
};

type ExistingSubscription = {
  id: string;
  user_id: string;
};

type EventProcessingStatus = "processing" | "processed" | "failed" | "ignored";

function unixTimestampToIso(value: number | null | undefined): string | null {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function getStripeCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer): string {
  return typeof customer === "string" ? customer : customer.id;
}

function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  start: string | null;
  end: string | null;
} {
  const firstItem = subscription.items.data[0];

  return {
    start: unixTimestampToIso(firstItem?.current_period_start),
    end: unixTimestampToIso(firstItem?.current_period_end),
  };
}

function getSubscriptionPriceId(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price.id?.trim();

  if (!priceId) {
    throw new Error(`Stripe subscription ${subscription.id} has no price identifier`);
  }

  return priceId;
}

function minimalEventPayload(event: Stripe.Event): Record<string, unknown> {
  const object = event.data.object as { id?: string; object?: string };

  return {
    event_id: event.id,
    event_type: event.type,
    object_id: object.id ?? null,
    object_type: object.object ?? null,
    created: event.created,
    livemode: event.livemode,
    api_version: event.api_version,
  };
}

async function claimEvent(event: Stripe.Event): Promise<"claimed" | "duplicate"> {
  const supabase = getSupabaseAdminClient();
  const payload = {
    stripe_event_id: event.id,
    event_type: event.type,
    processing_status: "processing" satisfies EventProcessingStatus,
    event_payload: minimalEventPayload(event),
  };

  const { error: insertError } = await supabase
    .from("billing_webhook_events")
    .insert(payload);

  if (!insertError) {
    return "claimed";
  }

  if (insertError.code !== "23505") {
    throw new Error(`Unable to register Stripe event: ${insertError.message}`);
  }

  const { data: existingEvent, error: readError } = await supabase
    .from("billing_webhook_events")
    .select("processing_status, processing_attempts")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (readError || !existingEvent) {
    throw new Error(`Unable to read duplicate Stripe event ${event.id}`);
  }

  if (existingEvent.processing_status !== "failed") {
    return "duplicate";
  }

  const { data: reclaimedRows, error: reclaimError } = await supabase
    .from("billing_webhook_events")
    .update({
      processing_status: "processing" satisfies EventProcessingStatus,
      processing_attempts: existingEvent.processing_attempts + 1,
      processing_error: null,
      processed_at: null,
      event_payload: minimalEventPayload(event),
    })
    .eq("stripe_event_id", event.id)
    .eq("processing_status", "failed")
    .select("id");

  if (reclaimError) {
    throw new Error(`Unable to reclaim Stripe event: ${reclaimError.message}`);
  }

  return reclaimedRows?.length === 1 ? "claimed" : "duplicate";
}

async function setEventStatus(
  eventId: string,
  status: Exclude<EventProcessingStatus, "processing">,
  processingError: string | null = null,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("billing_webhook_events")
    .update({
      processing_status: status,
      processing_error: processingError,
      processed_at: new Date().toISOString(),
    })
    .eq("stripe_event_id", eventId)
    .eq("processing_status", "processing")
    .select("id");

  if (error || data?.length !== 1) {
    throw new Error(`Unable to finalize Stripe event ${eventId}`);
  }
}

async function findBillingCustomer(stripeCustomerId: string): Promise<BillingCustomer> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("billing_customers")
    .select("id, user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle<BillingCustomer>();

  if (error) {
    throw new Error(`Unable to read billing customer: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No billing customer mapping for Stripe customer ${stripeCustomerId}`);
  }

  return data;
}

async function synchronizeSubscription(subscription: Stripe.Subscription): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const stripeCustomerId = getStripeCustomerId(subscription.customer);
  const billingCustomer = await findBillingCustomer(stripeCustomerId);
  const period = getSubscriptionPeriod(subscription);

  const subscriptionData = {
    billing_customer_id: billingCustomer.id,
    user_id: billingCustomer.user_id,
    stripe_price_id: getSubscriptionPriceId(subscription),
    status: subscription.status,
    current_period_start: period.start,
    current_period_end: period.end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: unixTimestampToIso(subscription.cancel_at),
    canceled_at: unixTimestampToIso(subscription.canceled_at),
    ended_at: unixTimestampToIso(subscription.ended_at),
  };

  const { data: existing, error: existingError } = await supabase
    .from("billing_subscriptions")
    .select("id, user_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle<ExistingSubscription>();

  if (existingError) {
    throw new Error(`Unable to read subscription: ${existingError.message}`);
  }

  if (existing) {
    if (existing.user_id !== billingCustomer.user_id) {
      throw new Error(`Subscription ${subscription.id} is linked to another user`);
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("billing_subscriptions")
      .update(subscriptionData)
      .eq("id", existing.id)
      .eq("stripe_subscription_id", subscription.id)
      .eq("user_id", billingCustomer.user_id)
      .select("id");

    if (updateError || updatedRows?.length !== 1) {
      throw new Error(`Subscription ${subscription.id} was not updated exactly once`);
    }

    return;
  }

  const { error: insertError } = await supabase
    .from("billing_subscriptions")
    .insert({
      ...subscriptionData,
      stripe_subscription_id: subscription.id,
    });

  if (insertError) {
    throw new Error(`Unable to create subscription: ${insertError.message}`);
  }
}

async function processEvent(event: Stripe.Event): Promise<"processed" | "ignored"> {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await synchronizeSubscription(event.data.object);
      return "processed";
    default:
      return "ignored";
  }
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown billing webhook error";
  return message.slice(0, 1000);
}

export async function POST(request: Request): Promise<NextResponse> {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = getStripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret(),
    );
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook" }, { status: 400 });
  }

  try {
    const claimResult = await claimEvent(event);

    if (claimResult === "duplicate") {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const result = await processEvent(event);
    await setEventStatus(event.id, result);

    return NextResponse.json({ received: true, result });
  } catch (error) {
    const message = safeErrorMessage(error);

    try {
      await setEventStatus(event.id, "failed", message);
    } catch {
      // Preserve the original failure response. Operational logs must capture both failures.
    }

    console.error("Billing webhook processing failed", {
      eventId: event.id,
      eventType: event.type,
      error: message,
    });

    return NextResponse.json({ error: "Billing webhook processing failed" }, { status: 500 });
  }
}
