const { fetchBigCommerceCustomer } = require('./bigCommerceService');
const { upsertHubSpotContact } = require('./hubSpotService');
const { toHubSpotContactProperties } = require('../utils/contactMapper');

async function syncCustomerCreatedWebhook(payload) {
  const customerId = payload.data && payload.data.id;

  if (!customerId) {
    throw new Error('Webhook payload does not include data.id');
  }

  const customer = await fetchBigCommerceCustomer(customerId);
  const properties = toHubSpotContactProperties(customer);
  const hubSpotContact = await upsertHubSpotContact(properties);

  console.log(`Synced BigCommerce customer ${customerId} to HubSpot contact ${hubSpotContact.id}`);
}

module.exports = {
  syncCustomerCreatedWebhook,
};
