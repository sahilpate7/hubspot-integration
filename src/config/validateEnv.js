const requiredEnv = [
  'BIGCOMMERCE_STORE_HASH',
  'BIGCOMMERCE_ACCESS_TOKEN',
  'HUBSPOT_ACCESS_TOKEN',
];

function assertConfig() {
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = {
  assertConfig,
};
