import express from "express";
import { createSubscription, handleWebhook } from "../controllers/stripeControllers.js";

const router = express.Router();

// Route to create subscription
router.post("/create-subscription", createSubscription);

// Stripe webhook endpoint
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

export default router;
