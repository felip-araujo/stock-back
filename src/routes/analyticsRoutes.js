import express from "express"
import { analyticsController } from "../controllers/analyticsController.js"

const router = express.Router();


router.post("/event", analyticsController.create);
router.get("/summary", analyticsController.summary);
router.post("/click", analyticsController.registerClick);
router.get("/page/:page", analyticsController.getByPage);

export default router;