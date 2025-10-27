import express from "express"
import { generateInvite } from "../controllers/inviteControllers.js"

const router = express.Router()
router.post("/generate", generateInvite)

export default router