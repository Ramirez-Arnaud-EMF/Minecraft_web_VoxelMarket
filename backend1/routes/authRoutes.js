import { Router } from "express";
import authAccountRoutes from "./authAccountRoutes.js";
import sessionRoutes from "./sessionRoutes.js";
import minecraftRoutes from "./minecraftRoutes.js";
import walletRoutes from "./walletRoutes.js";

const router = Router();

router.use(authAccountRoutes);
router.use(sessionRoutes);
router.use(minecraftRoutes);
router.use(walletRoutes);

export default router;
