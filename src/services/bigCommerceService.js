const config = require('../config');

async function bigCommerceRequest(path) {
  const response = await fetch(`https://api.bigcommerce.com/stores/${config.bigCommerceStoreHash}${path}`, {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-auth-token': config.bigCommerceAccessToken,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`BigCommerce API error ${response.status}: ${JSON.stringify(body)}`);
  }

  return body;
}

async function fetchBigCommerceCustomer(customerId) {
  const customerResponse = await bigCommerceRequest(`/v3/customers?id:in=${encodeURIComponent(customerId)}`);
  const customer = customerResponse.data && customerResponse.data[0];

  if (!customer) {
    throw new Error(`BigCommerce customer not found: ${customerId}`);
  }

  return customer;
}

module.exports = {
  fetchBigCommerceCustomer,
};
