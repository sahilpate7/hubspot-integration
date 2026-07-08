const { fetchBigCommerceCompany } = require('./bigCommerceService');
const { upsertHubSpotCompany } = require('./hubSpotService');
const { toHubSpotCompanyProperties } = require('../utils/companyMapper');

async function syncCompanyCreatedWebhook(payload) {
  const companyId = payload.data && (payload.data.company_id || payload.data.id);

  if (!companyId) {
    throw new Error('Webhook payload does not include data.company_id');
  }
  console.log('company id: ', companyId);

  const company = await fetchBigCommerceCompany(companyId);
  const properties = toHubSpotCompanyProperties(company);
  console.log('hubspot company properties: ', properties);
  const hubSpotCompany = await upsertHubSpotCompany(properties);
  console.log('hubspot company: ', hubSpotCompany);

  console.log(`Synced BigCommerce company ${companyId} to HubSpot company ${hubSpotCompany.id}`);
}

module.exports = {
  syncCompanyCreatedWebhook,
};
