import prisma from "../services/prismaClient.js";
import stripe from "../services/stripeService";


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

  // ⚡ Evento de checkout concluído
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // companyId foi enviado nos metadata ao criar a sessão
    const companyId = session.metadata?.companyId;
    const subscriptionId = session.subscription; // ID da assinatura Stripe
    const customerEmail = session.customer_email;

    if (!companyId || !subscriptionId) {
      console.error("Dados obrigatórios não encontrados no session metadata");
      return res.status(400).send("Dados insuficientes");
    }

    try {
      await prisma.subscription.upsert({
        where: { companyId: Number(companyId) },
        update: {
          stripeSubscriptionId: subscriptionId,
          status: "active",
          updatedAt: new Date(),
        },
        create: {
          companyId: Number(companyId),
          stripeSubscriptionId: subscriptionId,
          email: customerEmail,
          status: "active",
        },
      });

      console.log(`✅ Assinatura da empresa ${companyId} salva com sucesso!`);
    } catch (error) {
      console.error("Erro ao salvar assinatura:", error);
      return res.status(500).send("Erro ao salvar assinatura");
    }
  }

  // Você pode tratar outros tipos de eventos aqui (ex: subscription.deleted)
  res.json({ received: true });
};