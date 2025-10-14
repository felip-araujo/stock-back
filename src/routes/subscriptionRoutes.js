import express from 'express';
import {
  createCompanySubscription,
  cancelCompanySubscription,
  getCompanySubscription,
  createSetupIntent,
  getStripePrices,
  handleStripeWebhook
} from '../controllers/subscriptionController.js';
import { authMiddleware } from '../middleware/auth.Middleware.js';
import { authorize } from '../middleware/authorize.Middleware.js';

const router = express.Router();

// Criar assinatura para empresa
router.post('/:companyId/subscribe', createCompanySubscription);

// Cancelar assinatura da empresa
router.post('/:companyId/cancel', authMiddleware, authorize(['COMPANY_ADMIN']), cancelCompanySubscription);

// Buscar status da assinatura da empresa
router.get('/:companyId/status', authMiddleware, authorize(['COMPANY_ADMIN']), getCompanySubscription);

// Criar SetupIntent para salvar método de pagamento
router.post('/setup-intent', authMiddleware, createSetupIntent);

// Buscar preços disponíveis no Stripe
router.get('/prices', authMiddleware, authorize(['COMPANY_ADMIN']), getStripePrices);

// Webhook do Stripe (não precisa de auth)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
