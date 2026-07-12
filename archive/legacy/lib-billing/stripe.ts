import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

/**
 * 🟢 CREATE CHECKOUT SESSION
 */
export async function createCheckoutSession(userId: string, plan: string) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: getPriceId(plan),
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_URL}/billing/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/billing/cancel`,
    metadata: {
      userId,
      plan,
    },
  });

  return session;
}

/**
 * 🟢 MAP PLAN → STRIPE PRICE
 */
function getPriceId(plan: string) {
  const prices: Record<string, string> = {
    free: "",
    pro: process.env.STRIPE_PRICE_PRO!,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
  };

  return prices[plan];
}