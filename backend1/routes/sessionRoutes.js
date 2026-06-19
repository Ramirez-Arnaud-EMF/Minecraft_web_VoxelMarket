import { Router } from "express";
import { sessionStatus } from "../controllers/sessionController.js";

const router = Router();

router.get("/session", sessionStatus);

export default router;