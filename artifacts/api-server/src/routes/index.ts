// ============================================================
// OpenCode Evolution - API Routes
// ============================================================

import { Router } from 'express';
import sandboxRoutes from './sandbox';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sandbox routes
router.use('/sandbox', sandboxRoutes);

// Preview routes (alias)
router.use('/preview', sandboxRoutes);

export default router;
