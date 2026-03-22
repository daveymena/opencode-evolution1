import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import filesRouter from "./files";
import messagesRouter from "./messages";
import opencodeRouter from "./opencode";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(filesRouter);
router.use(messagesRouter);
router.use(opencodeRouter);

export default router;
