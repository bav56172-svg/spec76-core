import Stripe from "stripe";

const endpoint =
  process.env.EP023_WEBHOOK_URL?.trim() ||
  "http://localhost:3000/api/billing/webhook";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

if (!webhookSecret) {
  console.error("Missing required environment variable: STRIPE_WEBHOOK_SECRET");
  process.exit(1);
}

const stripe = new Stripe("REMOVED_ROTATED_STRIPE_SECRET");
const eventId = `evt_ep023_local_${Date.now()}`;
const payload = JSON.stringify({
  id: eventId,
  object: "event",
  api_version: null,
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: `cus_ep023_local_${Date.now()}`,
      object: "customer",
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: null,
    idempotency_key: null,
  },
  type: "customer.created",
});

function createSignature(body) {
  return stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret: webhookSecret,
  });
}

async function requestWebhook({ body = payload, signature } = {}) {
  const headers = {
    "content-type": "application/json",
  };

  if (signature) {
    headers["stripe-signature"] = signature;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body,
  });

  const responseText = await response.text();
  let responseBody;

  try {
    responseBody = JSON.parse(responseText);
  } catch {
    responseBody = responseText;
  }

  return {
    status: response.status,
    body: responseBody,
  };
}

function assertResult(condition, message, context) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    console.error(JSON.stringify(context, null, 2));
    process.exit(1);
  }

  console.log(`PASS: ${message}`);
}

const missingSignature = await requestWebhook();
assertResult(
  missingSignature.status === 400 &&
    missingSignature.body?.error === "Missing Stripe signature",
  "request without Stripe signature is rejected",
  missingSignature,
);

const invalidSignature = await requestWebhook({
  signature: "t=1,v1=invalid",
});
assertResult(
  invalidSignature.status === 400 &&
    invalidSignature.body?.error === "Invalid Stripe webhook",
  "request with invalid Stripe signature is rejected",
  invalidSignature,
);

const validSignature = createSignature(payload);
const firstDelivery = await requestWebhook({
  signature: validSignature,
});
assertResult(
  firstDelivery.status === 200 &&
    firstDelivery.body?.received === true &&
    firstDelivery.body?.result === "ignored",
  "valid unsupported event is authenticated and recorded as ignored",
  firstDelivery,
);

const duplicateDelivery = await requestWebhook({
  signature: validSignature,
});
assertResult(
  duplicateDelivery.status === 200 &&
    duplicateDelivery.body?.received === true &&
    duplicateDelivery.body?.duplicate === true,
  "second delivery of the same Stripe event is idempotent",
  duplicateDelivery,
);

console.log(
  JSON.stringify(
    {
      all_passed: true,
      endpoint,
      event_id: eventId,
      passed_count: 4,
    },
    null,
    2,
  ),
);
