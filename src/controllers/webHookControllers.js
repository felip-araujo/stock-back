// src/controllers/subscriptionController.js
import prisma from "../services/prismaClient.js";
import stripe from "../services/stripeService.js";

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
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
      case 'invoice.payment_succeeded':
        // Pagamento bem-sucedido
        const invoice = event.data.object;
        console.log('Pagamento bem-sucedido:', invoice.id);
        break;

      case 'invoice.payment_failed':
        // Pagamento falhou
        const failedInvoice = event.data.object;
        console.log('Pagamento falhou:', failedInvoice.id);
        break;

      case 'customer.subscription.updated':
        // Assinatura atualizada
        const updatedSubscription = event.data.object;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: updatedSubscription.id },
          data: {
            status: updatedSubscription.status,
            currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
            updatedAt: new Date(),
          },
        });
        break;

      case 'checkout.session.completed':
        // Checkout concluído com sucesso
        const session = event.data.object;
        const customerEmail = session.customer_email;

        console.log('Evento checkout.session.completed recebido');
        console.log('Customer email:', customerEmail);
        console.log('Session mode:', session.mode);
        console.log('Session subscription:', session.subscription);

        if (session.mode === 'subscription' && session.subscription) {
          // Buscar a empresa pelo email do representante
          const company = await prisma.company.findUnique({
            where: { rep_email: customerEmail }
          });

          console.log('Empresa encontrada:', company ? `ID ${company.id}` : 'Nenhuma empresa encontrada');

          if (!company) {
            console.error('Empresa não encontrada para o email:', customerEmail);
            return res.status(400).json({ error: 'Empresa não encontrada' });
          }

          const companyId = company.id;

          // Criar registro na tabela subscription
          const subscription = await prisma.subscription.create({
            data: {
              companyId: Number(companyId),
              stripeSubscriptionId: session.subscription,
              status: "active",
            },
          });

          console.log('Assinatura criada com sucesso:', subscription.id, 'para empresa:', companyId);
        } else {
          console.log('Evento não é subscription ou não tem subscription ID');
        }
        break;

      case 'customer.subscription.deleted':
        // Assinatura cancelada
        const canceledSubscription = event.data.object;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: canceledSubscription.id },
          data: {
            status: 'canceled',
            updatedAt: new Date(),
          },
        });
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const activeUsers = async (req, res) => {
  try {
    const activeUsers = await prisma.user.findMany({
      where: {
        company: {
          subscription: {
            status: "active"
          }
        }
      },
      include: {
        company: {
          include: {
            subscription: true
          }
        }
      }
    });
    res.status(200).json(activeUsers);
  } catch (err) {
    console.error("Erro ao buscar usuários ativos:", err);
    res.status(500).send("Erro interno ao buscar usuários ativos");
  }
};
