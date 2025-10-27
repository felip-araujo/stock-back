import express from "express";
import { cancelCreate, getCancel } from "../controllers/CancelFormController.js";

const router = express.Router();

router.post("/", cancelCreate);
router.get("/", getCancel)


export default router
