import {
  createSubscription,
  cancelSubscription,
  createPaymentIntent,
  getPrices,
} from "../services/stripeService.js";
import prisma from "../services/prismaClient.js";
import Stripe from "stripe";
import { EnviarEmail } from "../services/sendWelcomeMailService.js";


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
    // 🔹 1. Caso o usuário inicie o TRIAL (com cartão cadastrado)
    // ========================================================
    if (trial === true || trial === "true") {
      // ✅ Define o plano gold como padrão do trial
      const goldTrialPriceId = priceId || "price_1SJG1MKKzmjTKU73xxqtViUk"; // ID do plano GOLD no Stripe

      // ✅ Verifica se já existe assinatura ativa ou trial para a empresa
      const existing = await prisma.subscription.findUnique({
        where: { companyId: Number(companyId) },
      });
      if (existing && existing.status !== "canceled") {
        return res.status(400).json({ message: "Empresa já possui assinatura ativa ou em teste." });
      }

      // ✅ Cria sessão de Checkout que coleta o cartão e inicia trial
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: company.rep_email,
        line_items: [{ price: goldTrialPriceId, quantity: 1 }],
        subscription_data: {
          trial_period_days: 7,
          metadata: {
            companyId: String(companyId),
            plano: "gold",
            isTrial: "true",
          },
        },
        metadata: {
          companyId: String(companyId),
          plano: "gold",
        },
        success_url: `${process.env.FRONTEND_URL}/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/assinatura/cancelada`,
      });

      return res.status(200).json({
        message: "Sessão de checkout criada com sucesso para o trial",
        url: session.url,
        sessionId: session.id,
      });
    }


    // ========================================================
    // 🔹 2. Assinatura normal (checkout Stripe)
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
          plano: plano || "gold", // 👈 padrão agora é gold
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

      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.id);
      const safeDate = (d) => (d ? new Date(d * 1000) : null);
      const planoFinal = session.metadata?.plano || plano || "gold";

      const updatedSubscription = await prisma.subscription.upsert({
        where: { companyId: Number(companyId) },
        update: {
          stripeSubscriptionId: stripeSubscription.id,
          status: stripeSubscription.status || "active",
          currentPeriodStart: safeDate(stripeSubscription.current_period_start),
          currentPeriodEnd: safeDate(stripeSubscription.current_period_end),
          trialEndsAt: safeDate(stripeSubscription.trial_end),
          email: session.customer_details?.email || null,
          plan: planoFinal,
          isTrial: stripeSubscription.trial_end ? true : false,
        },
        create: {
          companyId: Number(companyId),
          stripeSubscriptionId: stripeSubscription.id,
          status: stripeSubscription.status || "active",
          currentPeriodStart: safeDate(stripeSubscription.current_period_start),
          currentPeriodEnd: safeDate(stripeSubscription.current_period_end),
          trialEndsAt: safeDate(stripeSubscription.trial_end),
          email: session.customer_details?.email || null,
          plan: planoFinal,
          isTrial: stripeSubscription.trial_end ? true : false,
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

export const getAllSubs = async (req, res) => {

  try {
    const assinaturas = await prisma.subscription.findMany({
      skip: req.pagination.skip,
      take: req.pagination.take,
    }
    )

    const total = await prisma.subscription.count();

    res.status(200).json({
      data: assinaturas,
      pagination: {
        total,
        page: req.pagination.page,
        limit: req.pagination.limit,
        totalPages: Math.ceil(total / req.pagination.limit),
      },
    });


  } catch (err) {
    res.status(400).json({ message: "Erro ao buscar assinaturas", err })
  }

}


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
  console.log("✅ Webhook Stripe recebido:", req.headers["stripe-signature"]);

  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // ⚠️ req.body deve ser o RAW body (middleware já configurado na rota)
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      // =====================================================
      // ✅ Pagamento bem-sucedido
      // =====================================================
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        console.log("💰 Pagamento bem-sucedido:", invoice.id);
        break;
      }

      // =====================================================
      // ❌ Pagamento falhou
      // =====================================================
      case "invoice.payment_failed": {
        const failedInvoice = event.data.object;
        console.log("⚠️ Pagamento falhou:", failedInvoice.id);
        break;
      }

      // =====================================================
      // 🔁 Atualização de assinatura
      // =====================================================
      case "customer.subscription.updated": {
        const s = event.data.object;

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: s.id },
          data: {
            status: s.status,
            currentPeriodStart: s.current_period_start ? new Date(s.current_period_start * 1000) : null,
            currentPeriodEnd: s.current_period_end ? new Date(s.current_period_end * 1000) : null,
            trialEndsAt: s.trial_end ? new Date(s.trial_end * 1000) : null,
            isTrial: s.status === "trial",
            updatedAt: new Date(),
          },
        });

        console.log("🔄 Assinatura atualizada:", s.id);
        break;
      }

      // =====================================================
      // 🛒 Checkout concluído
      // =====================================================
      case "checkout.session.completed": {
        const session = event.data.object;
        const companyId = Number(session.metadata?.companyId);
        console.log("✅ Checkout concluído para empresa:", companyId);

        if (!companyId) {
          console.log("⚠️ Nenhum companyId encontrado na metadata");
          break;
        }

        // ⚙️ Faz chamada interna para confirmar assinatura (reutiliza lógica do createCompanySubscription)
        try {
          const backendUrl = `${process.env.BACKEND_URL}/subscription/${companyId}`;
          const response = await fetch(backendUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: session.id }),
          });

          const result = await response.json();
          console.log("🔁 Assinatura confirmada via webhook:", result);
        } catch (err) {
          console.error("❌ Erro ao confirmar assinatura via webhook:", err.message);
        }

        break;
      }

      // =====================================================
      // ❌ Assinatura cancelada
      // =====================================================
      case "customer.subscription.deleted": {
        const canceled = event.data.object;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: canceled.id },
          data: {
            status: "canceled",
            updatedAt: new Date(),
          },
        });
        console.log("❌ Assinatura cancelada:", canceled.id);
        break;
      }

      // =====================================================
      // 🆕 Nova assinatura criada (trial ou normal)
      // =====================================================
      case "customer.subscription.created": {
        const s = event.data.object;
        const companyId = Number(s.metadata?.companyId) || null;

        // ✅ Busca detalhes completos da assinatura (pois o evento pode vir incompleto)
        const fullSub = await stripe.subscriptions.retrieve(s.id);

        const safeDate = (d) => (d ? new Date(d * 1000) : null);

        const currentPeriodStart = safeDate(fullSub.current_period_start);
        const currentPeriodEnd = safeDate(fullSub.current_period_end);
        const trialEndsAt = safeDate(fullSub.trial_end);

        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: s.id },
          update: {
            status: fullSub.status,
            currentPeriodStart,
            currentPeriodEnd,
            trialEndsAt,
            plan: fullSub.items?.data?.[0]?.price?.nickname || "gold",
            updatedAt: new Date(),
          },
          create: {
            stripeSubscriptionId: s.id,
            status: fullSub.status,
            currentPeriodStart,
            currentPeriodEnd,
            trialEndsAt,
            plan: fullSub.items?.data?.[0]?.price?.nickname || "gold",
            companyId,
            isTrial: fullSub.status === "trialing",
            email: fullSub.customer_email || null,
          },
        });

        console.log("🟢 Assinatura criada (dados completos):", {
          companyId,
          start: currentPeriodStart,
          end: currentPeriodEnd,
          trialEndsAt,
        });

        break;
      }


      // =====================================================
      // 🔹 Outros eventos não tratados
      // =====================================================
      default:
        console.log(`⚪ Evento não tratado: ${event.type}`);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);
    res.status(500).json({ error: "Erro interno ao processar webhook", details: error.message });
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
        plan: "gold",
        currentPeriodStart: now,
        currentPeriodEnd: trialEndsAt,
      },
    })


    res.status(200).json({
      message: `Período de teste iniciado com sucesso. Válido até ${trialEndsAt.toLocaleDateString("pt-BR")}.`,
      subscription,
    })
    const emailUser = subscription.email
    const fimTeste = trialEndsAt.toLocaleDateString("pt-br")
    // console.log(emailUser)
    EnviarEmail(emailUser, fimTeste)
    return

  } catch (error) {
    console.error("Erro ao iniciar trial:", error)
    res.status(500).json({ message: "Erro ao iniciar trial", error: error.message })
  }
}



