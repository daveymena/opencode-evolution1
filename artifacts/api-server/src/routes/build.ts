import express from "express";
import { db } from "@workspace/db";
import { projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const buildRouter = express.Router();

// GET /api/projects/:projectId/compile - Get build status
buildRouter.get("/:projectId/compile", async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, parseInt(projectId)))
      .limit(1);

    if (!project.length) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({
      projectId,
      status: "idle",
      lastBuild: null,
      buildLogs: [],
    });
  } catch (error) {
    console.error("Get compile status error:", error);
    res.status(500).json({ error: "Failed to get build status" });
  }
});

// POST /api/projects/:projectId/compile - Start compilation
buildRouter.post("/:projectId/compile", async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, parseInt(projectId)))
      .limit(1);

    if (!project.length) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Aquí se podría integrar con un sistema de compilación real
    // Por ahora, retornamos una respuesta simulada
    
    res.json({
      success: true,
      projectId,
      message: "Compilation started",
      buildId: `build_${Date.now()}`,
    });
  } catch (error) {
    console.error("Compilation error:", error);
    res.status(500).json({ error: "Compilation failed" });
  }
});

// POST /api/projects/:projectId/export - Export project
buildRouter.post("/:projectId/export", async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, parseInt(projectId)))
      .limit(1);

    if (!project.length) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Retornar un ZIP con los archivos del proyecto
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="project-${projectId}-${Date.now()}.zip"`
    );
    
    // Aquí se implementaría la lógica para generar el ZIP
    res.json({ message: "Export would generate a ZIP file" });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Export failed" });
  }
});
