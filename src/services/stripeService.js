import Stripe from 'stripe';
import prisma from './prismaClient.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createSubscription = async (companyId, priceId, paymentMethodId) => {
  try {
    // Buscar a empresa
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { subscription: true }
    });

    if (!company) {
      throw new Error('Empresa não encontrada');
    }

    if (company.subscription) {
      throw new Error('Empresa já possui uma assinatura ativa');
    }

    // Criar cliente no Stripe
    const customer = await stripe.customers.create({
      email: company.rep_email,
      name: company.representant,
      metadata: {
        companyId: companyId.toString()
      }
    });

    // Anexar método de pagamento ao cliente
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Definir como método de pagamento padrão
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Criar assinatura
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: priceId,
      }],
      expand: ['latest_invoice.payment_intent'],
    });

    // Salvar no banco de dados
    const dbSubscription = await prisma.subscription.create({
      data: {
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : new Date(),
        currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        companyId: companyId,
      },
    });

    return {
      subscription: dbSubscription,
      stripeSubscription: subscription,
      customer: customer
    };
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    throw error;
  }
};

export const cancelSubscription = async (companyId) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
    });

    if (!subscription) {
      throw new Error('Assinatura não encontrada');
    }

    // Cancelar no Stripe
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    // Atualizar no banco
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'canceled',
        updatedAt: new Date(),
      },
    });

    return canceledSubscription;
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    throw error;
  }
};

export const getSubscriptionStatus = async (companyId) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
    });

    if (!subscription) {
      return null;
    }

    // Buscar status atual no Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

    // Atualizar no banco se necessário
    if (stripeSubscription.status !== subscription.status) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: stripeSubscription.status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          updatedAt: new Date(),
        },
      });
    }

    return stripeSubscription;
  } catch (error) {
    console.error('Erro ao buscar status da assinatura:', error);
    throw error;
  }
};

export const createPaymentIntent = async (amount, currency = 'brl') => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe trabalha com centavos
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Erro ao criar PaymentIntent:', error);
    throw error;
  }
};

export const getPrices = async () => {
  try {
    const prices = await stripe.prices.list({
      active: true,
      type: 'recurring',
    });

    return prices.data;
  } catch (error) {
    console.error('Erro ao buscar preços:', error);
    throw error;
  }
};

export default stripe;
