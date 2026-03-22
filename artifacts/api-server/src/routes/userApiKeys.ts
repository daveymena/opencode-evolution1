import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, userApiKeysTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Cifrado simple con AES usando la JWT_SECRET como clave
// En producción usar una librería como `crypto` nativa de Node
import crypto from "crypto";

const ENCRYPTION_KEY = (process.env.JWT_SECRET || "changeme-use-env-var").padEnd(32, "0").slice(0, 32);
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString();
}

// GET /user/api-keys
router.get("/user/api-keys", requireAuth, async (req, res): Promise<void> => {
  const keys = await db.select().from(userApiKeysTable)
    .where(eq(userApiKeysTable.userId, req.user!.userId));

  // Devolver con la key parcialmente enmascarada
  const masked = keys.map(k => ({
    id: k.id,
    provider: k.provider,
    keyMasked: "sk-..." + decrypt(k.keyEncrypted).slice(-4),
    createdAt: k.createdAt,
  }));
  res.json(masked);
});

// POST /user/api-keys
router.post("/user/api-keys", requireAuth, async (req, res): Promise<void> => {
  const { provider, key } = req.body;
  if (!provider || !key) {
    res.status(400).json({ error: "provider y key son requeridos" });
    return;
  }

  // Reemplazar si ya existe para ese provider
  await db.delete(userApiKeysTable).where(
    and(eq(userApiKeysTable.userId, req.user!.userId), eq(userApiKeysTable.provider, provider))
  );

  const [apiKey] = await db.insert(userApiKeysTable).values({
    userId: req.user!.userId,
    provider,
    keyEncrypted: encrypt(key),
  }).returning();

  res.status(201).json({ id: apiKey.id, provider: apiKey.provider, createdAt: apiKey.createdAt });
});

// DELETE /user/api-keys/:provider
router.delete("/user/api-keys/:provider", requireAuth, async (req, res): Promise<void> => {
  const provider = String(req.params.provider);
  await db.delete(userApiKeysTable).where(
    and(eq(userApiKeysTable.userId, req.user!.userId), eq(userApiKeysTable.provider, provider))
  );
  res.sendStatus(204);
});

export default router;
