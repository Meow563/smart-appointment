import { Router } from 'express';
import Joi from 'joi';
import {
  exportConversations,
  getConversation,
  getConversations,
  getDashboard,
  resolveConversation
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { validateBody } from '../middlewares/validateRequest.js';

const router = Router();

router.use(requireAuth, requireRole(['admin', 'super_admin']));

router.get('/dashboard', getDashboard);
router.get('/conversations', getConversations);
router.get('/conversations/export', exportConversations);
router.get('/conversations/:id', getConversation);
router.patch(
  '/conversations/:id/resolve',
  validateBody(Joi.object({ note: Joi.string().max(500).allow('').optional() })),
  resolveConversation
);

export default router;
