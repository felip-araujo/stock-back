import {
  createSubscription,
  cancelSubscription,
  createPaymentIntent,
  getPrices,
} from "../services/stripeService.js";
import prisma from "../services/prismaClient.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCompanySubscription = async (req, res) => {
  const { companyId } = req.params;
  const { priceId, sessionId, plano } = req.body;

  try {
    // 🔹 1. Criação da sessão de checkout
    if (priceId) {
      const company = await prisma.company.findUnique({
        where: { id: Number(companyId) },
      });

      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: company.rep_email,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.FRONTEND_URL}/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/assinatura/cancelada`,
        metadata: { 
          companyId: String(companyId),
          plano: plano || "basic" // ✅ salva o plano no metadata
        },
      });

      return res.status(200).json({
        message: "Sessão de checkout criada com sucesso",
        url: session.url,
        sessionId: session.id,
      });
    }

    // 🔹 2. Confirmação da assinatura (Stripe → Prisma)
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription"],
      });

      const subscription = session.subscription;

      if (!subscription) {
        return res.status(404).json({ message: "Assinatura não encontrada" });
      }

      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.id
      );

      // Garante que as datas sejam válidas
      const currentPeriodStart = stripeSubscription.current_period_start
        ? new Date(stripeSubscription.current_period_start * 1000)
        : null;
      const currentPeriodEnd = stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : null;

      // Evita crash caso a data seja inválida
      const safeDate = (d) => (d instanceof Date && !isNaN(d) ? d : null);

      // ✅ Recupera o plano salvo no metadata da sessão, ou usa o default se não houver
      const planoFinal = session.metadata?.plano || plano || "basic";

      const updatedSubscription = await prisma.subscription.upsert({
        where: { companyId: Number(companyId) },
        update: {
          stripeSubscriptionId: stripeSubscription.id,
          status: stripeSubscription.status || "active",
          currentPeriodStart: safeDate(currentPeriodStart),
          currentPeriodEnd: safeDate(currentPeriodEnd),
          email: session.customer_details?.email || null,
          plan: planoFinal, // ✅ salva o plano corretamente
        },
        create: {
          companyId: Number(companyId),
          stripeSubscriptionId: stripeSubscription.id,
          status: stripeSubscription.status || "active",
          currentPeriodStart: safeDate(currentPeriodStart),
          currentPeriodEnd: safeDate(currentPeriodEnd),
          email: session.customer_details?.email || null,
          plan: planoFinal, // ✅ idem na criação
        },
      });

      return res.status(200).json({
        message: "Assinatura confirmada com sucesso",
        status: updatedSubscription.status,
        plan: updatedSubscription.plan, // ✅ retorna o plano para conferência
      });
    }

    // 🔹 Caso nenhum parâmetro tenha sido enviado
    return res.status(400).json({ message: "Informe priceId ou sessionId" });
  } catch (error) {
    console.error("Erro ao criar/confirmar assinatura:", error);
    res.status(500).json({
      message: "Erro ao criar/confirmar assinatura",
      error: error.message,
    });
  }
};


export const cancelCompanySubscription = async (req, res) => {
  const { companyId } = req.params;

  try {
    const canceledSubscription = await cancelSubscription(Number(companyId));

    res.status(200).json({
      message: "Assinatura cancelada com sucesso",
      subscription: canceledSubscription,
    });
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);
    res.status(500).json({
      message: "Erro ao cancelar assinatura",
      error: error.message,
    });
  }
};

//   const { companyId } = req.params;

//   try {
//     const subscription = await getSubscriptionStatus(Number(companyId));

//     if (!subscription) {
//       return res.status(404).json({
//         message: 'Assinatura não encontrada'
//       });
//     }

//     res.status(200).json({
//       subscription: subscription
//     });
//   } catch (error) {
//     console.error('Erro ao buscar assinatura:', error);
//     res.status(500).json({
//       message: 'Erro ao buscar assinatura',
//       error: error.message
//     });
//   }
// };

export const createSetupIntent = async (req, res) => {
  try {
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ["card"],
    });

    res.status(200).json({
      client_secret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error("Erro ao criar SetupIntent:", error);
    res.status(500).json({
      message: "Erro ao criar SetupIntent",
      error: error.message,
    });
  }
};

export const getStripePrices = async (req, res) => {
  try {
    const prices = await getPrices();

    res.status(200).json({
      prices: prices,
    });
  } catch (error) {
    console.error("Erro ao buscar preços:", error);
    res.status(500).json({
      message: "Erro ao buscar preços",
      error: error.message,
    });
  }
};

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "invoice.payment_succeeded":
        // Pagamento bem-sucedido
        const invoice = event.data.object;
        console.log("Pagamento bem-sucedido:", invoice.id);
        break;

      case "invoice.payment_failed":
        // Pagamento falhou
        const failedInvoice = event.data.object;
        console.log("Pagamento falhou:", failedInvoice.id);
        break;

      case "customer.subscription.updated":
        // Assinatura atualizada
        const updatedSubscription = event.data.object;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: updatedSubscription.id },
          data: {
            status: updatedSubscription.status,
            currentPeriodStart: new Date(
              updatedSubscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(
              updatedSubscription.current_period_end * 1000
            ),
            updatedAt: new Date(),
          },
        });
        break;

      case "checkout.session.completed":
        // Checkout concluído com sucesso
        const session = event.data.object;
        const companyId = session.metadata.companyId;

        if (session.mode === "subscription" && session.subscription) {
          // Buscar a assinatura no Stripe para obter detalhes
          const stripeSubscription = await stripe.subscriptions.retrieve(
            session.subscription
          );

          // Salvar ou atualizar a assinatura no banco de dados
          await prisma.subscription.upsert({
            where: { companyId: Number(companyId) },
            update: {
              stripeSubscriptionId: stripeSubscription.id,
              status: stripeSubscription.status,
              currentPeriodStart: new Date(
                stripeSubscription.current_period_start * 1000
              ),
              currentPeriodEnd: new Date(
                stripeSubscription.current_period_end * 1000
              ),
              updatedAt: new Date(),
            },
            create: {
              stripeSubscriptionId: stripeSubscription.id,
              status: stripeSubscription.status,
              currentPeriodStart: new Date(
                stripeSubscription.current_period_start * 1000
              ),
              currentPeriodEnd: new Date(
                stripeSubscription.current_period_end * 1000
              ),
              companyId: Number(companyId),
            },
          });

          console.log(
            "Assinatura criada/atualizada com sucesso para empresa:",
            companyId
          );
        }
        break;

      case "customer.subscription.deleted":
        // Assinatura cancelada
        const canceledSubscription = event.data.object;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: canceledSubscription.id },
          data: {
            status: "canceled",
            updatedAt: new Date(),
          },
        });
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// GET /subscription/status/:companyId
export const checkSubscription = async (req, res, next) => {
  try {
    const companyId = Number(req.params.companyId);
    console.log(companyId);

    if (!companyId) {
      return res.status(400).json({ message: "ID da empresa não fornecido" });
    }

    // Busca apenas o que precisa: companyId e status
    const subscription = await prisma.subscription.findUnique({
      where: { companyId: Number(companyId) },
      // select: { status: true } // <--- evita carregar relacionamentos
    });

    console.log(subscription);

    if (!subscription || subscription.status !== "active") {
      return res.status(403).json({
        message: "Assinatura inativa ou inexistente",
        active: false,
      });
    }

    res.status(200).json({ data: subscription });
    next();
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error);
    res.status(500).json({
      message: "Erro interno ao verificar assinatura",
      error: error.message,
    });
  }
};
