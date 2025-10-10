import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

/**
 * Create a Stripe customer for a company
 * @param {string} email
 * @returns {Promise<Stripe.Customer>}
 */
export async function createCustomer(email) {
  return await stripe.customers.create({ email });
}

/**
 * Create a subscription with a 7-day trial for a customer
 * @param {string} customerId
 * @param {string} priceId - Stripe Price ID for the subscription plan
 * @returns {Promise<Stripe.Subscription>}
 */
export async function createSubscriptionWithTrial(customerId, priceId) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: 7,
    expand: ["latest_invoice.payment_intent"],
  });
}

/**
 * Retrieve subscription by ID
 * @param {string} subscriptionId
 * @returns {Promise<Stripe.Subscription>}
 */
export async function retrieveSubscription(subscriptionId) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel a subscription
 * @param {string} subscriptionId
 * @returns {Promise<Stripe.Subscription>}
 */
export async function cancelSubscription(subscriptionId) {
  return await stripe.subscriptions.del(subscriptionId);
}

export default stripe;
