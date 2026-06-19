import { Router } from "express";
import { walletStatus, walletAdjust } from "../controllers/walletController.js";
import { validateUsernameParam, validateWalletAdjust } from "../middlewares/requestValidation.js";

const router = Router();

router.get("/wallet/:username", validateUsernameParam, walletStatus);
router.post("/wallet/adjust", validateWalletAdjust, walletAdjust);

export default router;