const config = require('../config');

async function hubSpotRequest(path, options = {}) {
  const response = await fetch(`https://api.hubapi.com${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${config.hubSpotAccessToken}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`HubSpot API error ${response.status}: ${JSON.stringify(body)}`);
  }

  return body;
}

async function findHubSpotContactByEmail(email) {
  const searchResponse = await hubSpotRequest('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'EQ',
              value: email,
            },
          ],
        },
      ],
      properties: ['email', 'firstname', 'lastname', 'phone', 'company'],
      limit: 1,
    }),
  });

  return searchResponse.results && searchResponse.results[0];
}

async function upsertHubSpotContact(properties) {
  if (!properties.email) {
    throw new Error('Cannot sync customer without an email address');
  }

  const existingContact = await findHubSpotContactByEmail(properties.email);

  if (existingContact) {
    return hubSpotRequest(`/crm/v3/objects/contacts/${existingContact.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties }),
    });
  }

  return hubSpotRequest('/crm/v3/objects/contacts', {
    method: 'POST',
    body: JSON.stringify({ properties }),
  });
}

async function findHubSpotCompany(propertyName, value) {
  const searchResponse = await hubSpotRequest('/crm/v3/objects/companies/search', {
    method: 'POST',
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            {
              propertyName,
              operator: 'EQ',
              value,
            },
          ],
        },
      ],
      properties: ['name', 'domain', 'phone', 'city', 'state', 'country'],
      limit: 1,
    }),
  });

  return searchResponse.results && searchResponse.results[0];
}

async function findExistingHubSpotCompany(properties) {
  if (properties.bigcommerce_company_id) {
    const companyByBigCommerceId = await findHubSpotCompany('bigcommerce_company_id', properties.bigcommerce_company_id);

    if (companyByBigCommerceId) {
      return companyByBigCommerceId;
    }
  }

  if (properties.domain) {
    const companyByDomain = await findHubSpotCompany('domain', properties.domain);

    if (companyByDomain) {
      return companyByDomain;
    }
  }

  return findHubSpotCompany('name', properties.name);
}

async function upsertHubSpotCompany(properties) {
  if (!properties.name) {
    throw new Error('Cannot sync company without a company name');
  }

  const existingCompany = await findExistingHubSpotCompany(properties);

  if (existingCompany) {
    return hubSpotRequest(`/crm/v3/objects/companies/${existingCompany.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties }),
    });
  }

  return hubSpotRequest('/crm/v3/objects/companies', {
    method: 'POST',
    body: JSON.stringify({ properties }),
  });
}

module.exports = {
  upsertHubSpotContact,
  upsertHubSpotCompany,
};
