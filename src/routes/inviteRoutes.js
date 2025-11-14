import express from "express"
import { generateInvite, getInvite } from "../controllers/inviteControllers.js"

const router = express.Router()
router.post("/generate", generateInvite)
router.get("/", getInvite)

export default router