import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  stripeClient = new Stripe(requireEnvironmentVariable("STRIPE_SECRET_KEY"));
  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  return requireEnvironmentVariable("STRIPE_WEBHOOK_SECRET");
}
