const config = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '0.0.0.0',
  bigCommerceStoreHash: process.env.BIGCOMMERCE_STORE_HASH,
  bigCommerceAccessToken: process.env.BIGCOMMERCE_ACCESS_TOKEN,
  hubSpotAccessToken: process.env.HUBSPOT_ACCESS_TOKEN,
  webhookSecret: process.env.WEBHOOK_SECRET,
  webhookSecretHeader: (process.env.WEBHOOK_SECRET_HEADER || 'x-webhook-secret').toLowerCase(),
  includeBigCommerceId: process.env.HUBSPOT_INCLUDE_BIGCOMMERCE_ID === 'true',
};

module.exports = config;
