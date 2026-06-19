import { Router } from "express";
import {
  requestMinecraftLinkCode,
  confirmMinecraftLinkCode,
  minecraftLinkStatus,
} from "../controllers/minecraftController.js";
import {
  validateMinecraftRequestCode,
  validateMinecraftConfirm,
  validateUsernameParam,
} from "../middlewares/requestValidation.js";

const router = Router();

router.post("/minecraft/request-code", validateMinecraftRequestCode, requestMinecraftLinkCode);
router.post("/minecraft/confirm", validateMinecraftConfirm, confirmMinecraftLinkCode);
router.get("/minecraft/status/:username", validateUsernameParam, minecraftLinkStatus);

export default router;