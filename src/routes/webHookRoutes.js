import express from "express"; 
import { handleStripeWebhook } from "../controllers/subscriptionController.js";
const router = express.Router();
router.post("/webhook", handleStripeWebhook)

export default router