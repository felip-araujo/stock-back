import express from "express";
import { handleStripeWebhook } from "../controllers/subscriptionController.js";

const router = express.Router();

// Apenas esta rota deve usar express.raw()
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

export default router;
