import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import projectsRouter from "./projects";
import filesRouter from "./files";
import messagesRouter from "./messages";
import opencodeRouter from "./opencode";
import userApiKeysRouter from "./userApiKeys";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(projectsRouter);
router.use(filesRouter);
router.use(messagesRouter);
router.use(opencodeRouter);
router.use(userApiKeysRouter);

export default router;
