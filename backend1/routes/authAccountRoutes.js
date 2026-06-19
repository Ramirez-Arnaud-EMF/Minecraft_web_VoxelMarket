import { Router } from "express";
import { config, register, login } from "../controllers/authAccountController.js";
import { validateRegisterRequest, validateLoginRequest } from "../middlewares/requestValidation.js";

const router = Router();

router.get("/config", config);
router.post("/register", validateRegisterRequest, register);
router.post("/login", validateLoginRequest, login);

export default router;