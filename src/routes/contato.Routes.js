import express from "express";
import { getContact, newContact } from "../controllers/contatoControllers.js";
import { paginate } from "../middleware/paginate.Middeware.js";
const router = express.Router();

router.post("/", newContact);
router.get("/", paginate, getContact)

export default router;
