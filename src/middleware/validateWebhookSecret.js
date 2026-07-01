const config = require('../config');

function validateWebhookSecret(req, res, next) {
  if (!config.webhookSecret) {
    next();
    return;
  }

  if (req.get(config.webhookSecretHeader) !== config.webhookSecret) {
    res.status(401).json({ error: 'Invalid webhook secret' });
    return;
  }
  console.log("webhook secret is verified")

  next();
}

module.exports = validateWebhookSecret;
