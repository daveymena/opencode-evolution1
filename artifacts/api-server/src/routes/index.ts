import { Router } from 'express';
import sandboxRoutes from './sandbox';
import authRoutes from './auth';
import projectsRoutes from './projects';
import filesRoutes from './files';
import buildRoutes from './build';
import messagesRoutes from './messages';
import userApiKeysRoutes from './userApiKeys';
import opencodeRoutes from './opencode';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas de autenticación y usuario (están prefijadas con /auth en el archivo)
router.use('/', authRoutes);
router.use('/', userApiKeysRoutes);

// Rutas de proyectos y archivos
router.use('/projects', projectsRoutes);
router.use('/files', filesRoutes);

// Rutas de IA y Mensajería
router.use('/messages', messagesRoutes);
router.use('/opencode', opencodeRoutes);

// Rutas de compilación y sandbox
router.use('/build', buildRoutes);
router.use('/sandbox', sandboxRoutes);
router.use('/preview', sandboxRoutes);

export default router;
