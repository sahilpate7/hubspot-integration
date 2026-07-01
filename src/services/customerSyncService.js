const { fetchBigCommerceCustomer } = require('./bigCommerceService');
const { upsertHubSpotContact } = require('./hubSpotService');
const { toHubSpotContactProperties } = require('../utils/contactMapper');

async function syncCustomerCreatedWebhook(payload) {
  const customerId = payload.data && payload.data.id;

  if (!customerId) {
    throw new Error('Webhook payload does not include data.id');
  }
  console.log("customer id: ", customerId)

  const customer = await fetchBigCommerceCustomer(customerId);
  const properties = toHubSpotContactProperties(customer);
  console.log("hubspot properties: ", properties)
  const hubSpotContact = await upsertHubSpotContact(properties);
  console.log("hubspot contact: ", hubSpotContact)

  console.log(`Synced BigCommerce customer ${customerId} to HubSpot contact ${hubSpotContact.id}`);
}

module.exports = {
  syncCustomerCreatedWebhook,
};
