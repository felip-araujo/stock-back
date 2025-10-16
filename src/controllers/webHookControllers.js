import Stripe from "stripe";
import prisma from "../services/prismaClient.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  console.log("📦 Evento recebido do Stripe:", event.type);


  let event;

  try {
    // ⚠️ req.body precisa ser o raw body (não JSON parseado!)
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Erro ao verificar assinatura do webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const data = event.data.object;

    switch (event.type) {
      // 🔹 Quando a assinatura é criada ou ativada
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: data.id },
          update: {
            status: data.status,
            currentPeriodStart: new Date(data.current_period_start * 1000),
            currentPeriodEnd: new Date(data.current_period_end * 1000),
            updatedAt: new Date(),
          },
          create: {
            stripeSubscriptionId: data.id,
            status: data.status,
            currentPeriodStart: new Date(data.current_period_start * 1000),
            currentPeriodEnd: new Date(data.current_period_end * 1000),
            companyId: Number(data.metadata.companyId),
          },
        });
        console.log(`Assinatura atualizada: ${data.id} (${data.status})`);
        break;

      // 🔹 Quando a assinatura é cancelada
      case "customer.subscription.deleted":
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: data.id },
          data: { status: "canceled", updatedAt: new Date() },
        });
        console.log(`Assinatura cancelada: ${data.id}`);
        break;

      // 🔹 Quando um pagamento falha
      case "invoice.payment_failed":
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: data.subscription },
          data: { status: "incomplete", updatedAt: new Date() },
        });
        console.log(`Pagamento falhou para: ${data.subscription}`);
        break;

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Erro ao processar webhook:", err);
    res.status(500).send("Erro interno ao processar webhook");
  }
};
