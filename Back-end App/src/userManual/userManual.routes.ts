import { Router } from "express";
import { downloadManual } from "./userManual.controller.js";

export const userManualRouter = Router();

userManualRouter.get("/:role", downloadManual);