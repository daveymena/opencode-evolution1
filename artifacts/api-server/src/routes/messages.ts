import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, messagesTable } from "@workspace/db";
import {
  ListMessagesParams,
  SendMessageBody,
  SendMessageParams,
  DeleteMessageParams,
  ListMessagesResponse,
} from "@workspace/api-zod";
import { runOpenCodeQuery } from "../lib/opencode";

const router: IRouter = Router();

router.get("/projects/:projectId/messages", async (req, res): Promise<void> => {
  const params = ListMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.projectId, params.data.projectId))
    .orderBy(messagesTable.createdAt);

  res.json(ListMessagesResponse.parse(messages));
});

router.post("/projects/:projectId/messages", async (req, res): Promise<void> => {
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [userMessage] = await db
    .insert(messagesTable)
    .values({
      projectId: params.data.projectId,
      role: "user",
      content: parsed.data.content,
    })
    .returning();

  const aiContent = await runOpenCodeQuery(parsed.data.content, params.data.projectId).catch((err) => {
    req.log.error({ err }, "Error running OpenCode query");
    return `Error: ${err.message || "OpenCode is not available"}`;
  });

  const [aiMessage] = await db
    .insert(messagesTable)
    .values({
      projectId: params.data.projectId,
      role: "assistant",
      content: aiContent,
    })
    .returning();

  res.status(201).json(aiMessage);
});

router.delete("/projects/:projectId/messages/:messageId", async (req, res): Promise<void> => {
  const params = DeleteMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(messagesTable)
    .where(
      and(
        eq(messagesTable.id, params.data.messageId),
        eq(messagesTable.projectId, params.data.projectId)
      )
    );

  res.sendStatus(204);
});

export default router;
