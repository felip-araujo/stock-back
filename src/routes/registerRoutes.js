import express from "express"
import { registerWithInvite } from "../controllers/registerController.js"

const router = express.Router()

router.post("/", registerWithInvite)


export default router