import { Router } from 'express';
import {
  facebookVerification,
  facebookWebhook,
  whatsappVerification,
  whatsappWebhook
} from '../controllers/webhookController.js';
import { verifyMetaSignature } from '../middlewares/webhookSignature.js';

const router = Router();

router.get('/whatsapp', whatsappVerification);
router.post('/whatsapp', verifyMetaSignature('WHATSAPP_APP_SECRET'), whatsappWebhook);

router.get('/facebook', facebookVerification);
router.post('/facebook', verifyMetaSignature('FACEBOOK_APP_SECRET'), facebookWebhook);

export default router;
