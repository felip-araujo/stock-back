
import { createCustomer, createSubscriptionWithTrial, retrieveSubscription, cancelSubscription } from "../services/stripeService.js";
import stripe from "../services/stripeService.js";
import prisma from "../services/prismaClient.js";

/**
 * Create a subscription for a company admin user
 * Expected body: { companyId, email, priceId, paymentMethodId }
 */
export async function createSubscription(req, res) {
  try {
    const { companyId, email, priceId, paymentMethodId } = req.body;

    // Check if company already has a subscription
    let existingSub;
    try {
      existingSub = await prisma.subscription.findUnique({
        where: { companyId },
      });
    } catch (error) {
      // If table doesn't exist or column missing, assume no subscription
      existingSub = null;
    }
    if (existingSub) {
      return res.status(400).json({ error: "Company already has a subscription" });
    }

    // Create Stripe customer
    const customer = await createCustomer(email);

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Create subscription with 7-day trial
    const subscription = await createSubscriptionWithTrial(customer.id, priceId);

    // Save subscription info in DB
    await prisma.subscription.create({
      data: {
        companyId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    return res.status(201).json({ subscription });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Handle Stripe webhook events for subscription updates
 */
export async function handleWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "customer.subscription.updated":
    case "customer.subscription.created":
    case "customer.subscription.deleted":
      const subscription = event.data.object;
      await updateSubscriptionInDB(subscription);
      break;
    case "invoice.payment_succeeded":
      // Handle successful payment
      break;
    case "invoice.payment_failed":
      // Handle failed payment
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}

/**
 * Update subscription status in DB based on Stripe event
 */
async function updateSubscriptionInDB(stripeSub) {
  try {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: stripeSub.id },
      data: {
        status: stripeSub.status,
        trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      },
    });
  } catch (error) {
    console.error("Error updating subscription in DB:", error);
  }
}


