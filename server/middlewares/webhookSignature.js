import crypto from 'crypto';

export function verifyMetaSignature(appSecretEnvKey) {
  return (req, res, next) => {
    const signature = req.headers['x-hub-signature-256'];
    const secret = process.env[appSecretEnvKey];

    if (!secret) return next();
    if (!signature || !req.rawBody) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    const expected = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(req.rawBody)
      .digest('hex')}`;

    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== signatureBuffer.length) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    next();
  };
}
