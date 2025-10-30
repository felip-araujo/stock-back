import express from 'express';
import {
  createCompanySubscription,
  cancelCompanySubscription,
  createSetupIntent,
  getStripePrices,
  handleStripeWebhook,
  checkSubscription,
  startTrial
} from '../controllers/subscriptionController.js';
import { authMiddleware } from '../middleware/auth.Middleware.js';
import { authorize } from '../middleware/authorize.Middleware.js';


const router = express.Router();

// Criar assinatura para empresa
router.post('/:companyId/subscribe', createCompanySubscription);

router.post('/:companyId', createCompanySubscription)

//Rota para iniciar o teste de 7 dias
router.post("/trial/start/:companyId", startTrial)

// Cancelar assinatura da empresa
router.post('/:companyId/cancel', authMiddleware, authorize(['COMPANY_ADMIN']), cancelCompanySubscription);

// Buscar status da assinatura da empresa
// router.get('/:companyId/status', authMiddleware, authorize(['COMPANY_ADMIN']), getCompanySubscription);

// Criar SetupIntent para salvar método de pagamento
router.post('/setup-intent', authMiddleware, createSetupIntent);

// Buscar preços disponíveis no Stripe
router.get('/prices', authMiddleware, authorize(['COMPANY_ADMIN']), getStripePrices);

// Webhook do Stripe (não precisa de auth)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

router.get("/status/:companyId", checkSubscription)

export default router;
 