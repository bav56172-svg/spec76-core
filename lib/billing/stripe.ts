import "server-only";

import { createHash } from "node:crypto";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

type ConstructEvent = Stripe["webhooks"]["constructEvent"];
type ConstructEventParameters = Parameters<ConstructEvent>;

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}

function shortSha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function installLocalWebhookDiagnostics(client: Stripe): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const originalConstructEvent = client.webhooks.constructEvent.bind(
    client.webhooks,
  ) as ConstructEvent;

  client.webhooks.constructEvent = ((
    ...args: ConstructEventParameters
  ): ReturnType<ConstructEvent> => {
    try {
      return originalConstructEvent(...args);
    } catch (error) {
      const [payload, header, secret] = args;
      const payloadBuffer =
        typeof payload === "string" ? Buffer.from(payload, "utf8") : Buffer.from(payload);
      const errorMessage =
        error instanceof Error ? error.message.slice(0, 1000) : "Unknown Stripe verification error";

      console.error("Stripe webhook verification diagnostics", {
        error: errorMessage,
        payloadBytes: payloadBuffer.byteLength,
        payloadSha256: shortSha256(payloadBuffer),
        signatureHeaderLength: Array.isArray(header)
          ? header.join(",").length
          : String(header).length,
        signatureSchemes: (Array.isArray(header) ? header.join(",") : String(header))
          .split(",")
          .map((part) => part.split("=", 1)[0]?.trim())
          .filter(Boolean),
        webhookSecretSha256: shortSha256(String(secret).trim()),
      });

      throw error;
    }
  }) as ConstructEvent;
}

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  stripeClient = new Stripe(requireEnvironmentVariable("STRIPE_SECRET_KEY"));
  installLocalWebhookDiagnostics(stripeClient);
  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  return requireEnvironmentVariable("STRIPE_WEBHOOK_SECRET");
}
