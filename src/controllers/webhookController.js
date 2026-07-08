const { syncCustomerCreatedWebhook } = require('../services/customerSyncService');
const { syncCompanyCreatedWebhook } = require('../services/companySyncService');

function handleCustomerCreated(req, res) {
  res.sendStatus(200);

  syncCustomerCreatedWebhook(req.body).catch((error) => {
    console.error('Customer sync failed:', error.message);
  });
}

function handleCompanyCreated(req, res) {
  res.sendStatus(200);

  syncCompanyCreatedWebhook(req.body).catch((error) => {
    console.error('Company sync failed:', error.message);
  });
}

module.exports = {
  handleCustomerCreated,
  handleCompanyCreated,
};
