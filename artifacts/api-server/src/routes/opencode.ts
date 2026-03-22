import { Router, type IRouter } from "express";
import { checkOpenCodeStatus } from "../lib/opencode";

const router: IRouter = Router();

router.get("/opencode/status", async (_req, res): Promise<void> => {
  const status = await checkOpenCodeStatus();
  res.json(status);
});

export default router;
