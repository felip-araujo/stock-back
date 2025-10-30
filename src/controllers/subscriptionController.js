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
  const { priceId, sessionId, plano, trial } = req.body;

  try {
    const company = await prisma.company.findUnique({
      where: { id: Number(companyId) },
    });

    if (!company) {
      return res.status(404).json({ message: "Empresa não encontrada" });
    }

    // ========================================================
    // 🔹 1. Caso o usuário queira iniciar o TRIAL (com Stripe)
    // ========================================================
    if (trial === true) {
      // ⚠️ Se não vier priceId, define o do plano Básico por padrão
      const trialPriceId = priceId || "price_1SAy2LKKzmjTKU738zEEFmhd"; // substitua pelo seu ID real

      // 1️⃣ Cria (ou reutiliza) o cliente no Stripe
      const customer = await stripe.customers.create({
        email: company.rep_email,
        metadata: {
          companyId: String(companyId),
          plano: plano || "basic",
        },
      });

      // 2️⃣ Cria assinatura com trial ativo
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: trialPriceId }],
        trial_period_days: 7,
        metadata: { companyId: String(companyId), plano: plano || "basic" },
      });

      // 3️⃣ Salva no banco
      const safeDate = (d) =>
        d ? new Date(d * 1000) : null;

      const trialEnd = subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null;

      const createdSub = await prisma.subscription.upsert({
        where: { companyId: Number(companyId) },
        update: {
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000)
            : null,
          currentPeriodEnd: trialEnd, // ✅ usa trial_end se houver
          email: company.rep_email,
          plan: plano || "basic",
          isTrial: true,
        },
        create: {
          companyId: Number(companyId),
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000)
            : null,
          currentPeriodEnd: trialEnd, // ✅ usa trial_end
          email: company.rep_email,
          plan: plano || "basic",
          isTrial: true,
        },
      });


      return res.status(200).json({
        message: "Assinatura trial criada com sucesso",
        trialEnd: safeDate(subscription.current_period_end),
        status: createdSub.status,
      });
    }

    // ========================================================
    // 🔹 2. Caso seja uma assinatura normal (checkout Stripe)
    // ========================================================
    if (priceId) {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: company.rep_email,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.FRONTEND_URL}/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/assinatura/cancelada`,
        metadata: {
          companyId: String(companyId),
          plano: plano || "basic",
        },
      });

      return res.status(200).json({
        message: "Sessão de checkout criada com sucesso",
        url: session.url,
        sessionId: session.id,
      });
    }

    // ========================================================
    // 🔹 3. Confirmação da assinatura após checkout
    // ========================================================
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

      const safeDate = (d) =>
        d ? new Date(d * 1000) : null;

      const planoFinal = session.metadata?.plano || plano || "basic";

      const updatedSubscription = await prisma.subscription.upsert({
        where: { companyId: Number(companyId) },
        update: {
          stripeSubscriptionId: stripeSubscription.id,
          status: stripeSubscription.status || "active",
          currentPeriodStart: safeDate(stripeSubscription.current_period_start),
          currentPeriodEnd: safeDate(stripeSubscription.current_period_end),
          email: session.customer_details?.email || null,
          plan: planoFinal,
        },
        create: {
          companyId: Number(companyId),
          stripeSubscriptionId: stripeSubscription.id,
          status: stripeSubscription.status || "active",
          currentPeriodStart: safeDate(stripeSubscription.current_period_start),
          currentPeriodEnd: safeDate(stripeSubscription.current_period_end),
          email: session.customer_details?.email || null,
          plan: planoFinal,
        },
      });

      return res.status(200).json({
        message: "Assinatura confirmada com sucesso",
        status: updatedSubscription.status,
        plan: updatedSubscription.plan,
      });
    }

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

    // Stripe retorna cancel_at como timestamp UNIX (em segundos)
    const cancelDate = canceledSubscription?.cancel_at
      ? new Date(canceledSubscription.cancel_at * 1000)
      : null;

    res.status(200).json({
      message: cancelDate
        ? `Assinatura cancelada com sucesso. Seu acesso permanecerá ativo até ${cancelDate.toLocaleDateString("pt-BR")}.`
        : "Assinatura cancelada com sucesso.",
      subscription: canceledSubscription,
      cancelAt: cancelDate,
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

    if (subscription.status === "trialing") {
      res.status(200).json({ data: subscription });
      next();
    }

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



//Rota para iniciar o Teste de 7 dias /trial/start/:companyId
export const startTrial = async (req, res) => {
  const { companyId } = req.params
  const trialDays = 7

  try {
    const now = new Date()
    const trialEndsAt = new Date(now)
    trialEndsAt.setDate(now.getDate() + trialDays)

    const subscription = await prisma.subscription.upsert({
      where: { companyId: Number(companyId) },
      update: {
        isTrial: true,
        trialEndsAt,
        status: "trial_active",
        currentPeriodStart: now,
        currentPeriodEnd: trialEndsAt,
      },
      create: {
        companyId: Number(companyId),
        isTrial: true,
        trialEndsAt,
        status: "trial_active",
        plan: "trial",
        currentPeriodStart: now,
        currentPeriodEnd: trialEndsAt,
      },
    })

    return res.status(200).json({
      message: `Período de teste iniciado com sucesso. Válido até ${trialEndsAt.toLocaleDateString("pt-BR")}.`,
      subscription,
    })
  } catch (error) {
    console.error("Erro ao iniciar trial:", error)
    res.status(500).json({ message: "Erro ao iniciar trial", error: error.message })
  }
}



