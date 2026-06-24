const { syncCustomerCreatedWebhook } = require('../services/customerSyncService');

function handleCustomerCreated(req, res) {
  res.sendStatus(200);

  syncCustomerCreatedWebhook(req.body).catch((error) => {
    console.error('Customer sync failed:', error.message);
  });
}

module.exports = {
  handleCustomerCreated,
};
