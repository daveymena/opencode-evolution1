import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, filesTable } from "@workspace/db";
import {
  CreateFileBody,
  CreateFileParams,
  UpdateFileBody,
  UpdateFileParams,
  DeleteFileParams,
  GetFileParams,
  ListFilesParams,
  ListFilesResponse,
  GetFileResponse,
  UpdateFileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/projects/:projectId/files", async (req, res): Promise<void> => {
  const params = ListFilesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const files = await db
    .select()
    .from(filesTable)
    .where(eq(filesTable.projectId, params.data.projectId))
    .orderBy(filesTable.path);

  res.json(ListFilesResponse.parse(files));
});

router.post("/projects/:projectId/files", async (req, res): Promise<void> => {
  const params = CreateFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateFileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [file] = await db
    .insert(filesTable)
    .values({ ...parsed.data, projectId: params.data.projectId })
    .returning();

  res.status(201).json(GetFileResponse.parse(file));
});

router.get("/projects/:projectId/files/:fileId", async (req, res): Promise<void> => {
  const params = GetFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [file] = await db
    .select()
    .from(filesTable)
    .where(
      and(
        eq(filesTable.id, params.data.fileId),
        eq(filesTable.projectId, params.data.projectId)
      )
    );

  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.json(GetFileResponse.parse(file));
});

router.put("/projects/:projectId/files/:fileId", async (req, res): Promise<void> => {
  const params = UpdateFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateFileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof filesTable.$inferInsert> = {};
  if (parsed.data.name !== undefined && parsed.data.name !== null) updateData.name = parsed.data.name;
  if (parsed.data.content !== undefined && parsed.data.content !== null) updateData.content = parsed.data.content;
  if (parsed.data.language !== undefined) updateData.language = parsed.data.language ?? undefined;

  const [file] = await db
    .update(filesTable)
    .set(updateData)
    .where(
      and(
        eq(filesTable.id, params.data.fileId),
        eq(filesTable.projectId, params.data.projectId)
      )
    )
    .returning();

  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.json(UpdateFileResponse.parse(file));
});

router.delete("/projects/:projectId/files/:fileId", async (req, res): Promise<void> => {
  const params = DeleteFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [file] = await db
    .delete(filesTable)
    .where(
      and(
        eq(filesTable.id, params.data.fileId),
        eq(filesTable.projectId, params.data.projectId)
      )
    )
    .returning();

  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
