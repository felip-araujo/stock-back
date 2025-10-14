import { createSubscription, cancelSubscription, getSubscriptionStatus, createPaymentIntent, getPrices } from '../services/stripeService.js';
import prisma from '../services/prismaClient.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCompanySubscription = async (req, res) => {
  const { companyId } = req.params;
  const { priceId, paymentMethodId } = req.body;

  try {
    if (!priceId || !paymentMethodId) {
      return res.status(400).json({
        message: 'priceId e paymentMethodId são obrigatórios'
      });
    }

    const result = await createSubscription(Number(companyId), priceId, paymentMethodId);

    res.status(201).json({
      message: 'Assinatura criada com sucesso',
      subscription: result.subscription,
      stripeSubscription: result.stripeSubscription,
      customer: result.customer
    });
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({
      message: 'Erro ao criar assinatura',
      error: error.message
    });
  }
};

export const cancelCompanySubscription = async (req, res) => {
  const { companyId } = req.params;

  try {
    const canceledSubscription = await cancelSubscription(Number(companyId));

    res.status(200).json({
      message: 'Assinatura cancelada com sucesso',
      subscription: canceledSubscription
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({
      message: 'Erro ao cancelar assinatura',
      error: error.message
    });
  }
};

export const getCompanySubscription = async (req, res) => {
  const { companyId } = req.params;

  try {
    const subscription = await getSubscriptionStatus(Number(companyId));

    if (!subscription) {
      return res.status(404).json({
        message: 'Assinatura não encontrada'
      });
    }

    res.status(200).json({
      subscription: subscription
    });
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({
      message: 'Erro ao buscar assinatura',
      error: error.message
    });
  }
};

export const createSetupIntent = async (req, res) => {
  try {
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card'],
    });

    res.status(200).json({
      client_secret: setupIntent.client_secret
    });
  } catch (error) {
    console.error('Erro ao criar SetupIntent:', error);
    res.status(500).json({
      message: 'Erro ao criar SetupIntent',
      error: error.message
    });
  }
};

export const getStripePrices = async (req, res) => {
  try {
    const prices = await getPrices();

    res.status(200).json({
      prices: prices
    });
  } catch (error) {
    console.error('Erro ao buscar preços:', error);
    res.status(500).json({
      message: 'Erro ao buscar preços',
      error: error.message
    });
  }
};

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
