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

module.exports = {
  upsertHubSpotContact,
};
