import express from "express";
import { handleStripeWebhook } from "../controllers/subscriptionController.js";
import { activeUsers } from "../controllers/webHookControllers.js";

const router = express.Router();

router.post("/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);


router.get("/", activeUsers)
export default router;
