// src/controllers/subscriptionController.js
import prisma from "../services/prismaClient.js";
import stripe from "../services/stripeService.js";

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️ Erro no webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const companyId = session.metadata?.companyId;
      const subscriptionId = session.subscription;
      const customerEmail = session.customer_email;

      if (!companyId || !subscriptionId) {
        console.error("Dados obrigatórios não encontrados no session metadata");
        return res.status(400).send("Dados insuficientes");
      }

      // Upsert simples, sem datas
      await prisma.subscription.upsert({
        where: { companyId: Number(companyId) },
        update: {
          stripeSubscriptionId: subscriptionId,
          status: "active",
        },
        create: {
          companyId: Number(companyId),
          stripeSubscriptionId: subscriptionId,
          email: customerEmail,
          status: "active",
        },
      });

      console.log(
        `✅ Assinatura da empresa ${companyId} salva ou atualizada com sucesso!`
      );
    } else {
      console.log(`Evento não tratado: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Erro ao processar webhook:", err);
    res.status(500).send("Erro interno ao processar webhook");
  }
};
