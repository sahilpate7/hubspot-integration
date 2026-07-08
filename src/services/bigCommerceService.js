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

async function bigCommerceB2BRequest(path) {
  const response = await fetch(`https://api-b2b.bigcommerce.com${path}`, {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-auth-token': config.bigCommerceAccessToken,
      'x-store-hash': config.bigCommerceStoreHash,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`BigCommerce B2B API error ${response.status}: ${JSON.stringify(body)}`);
  }

  return body;
}

async function fetchBigCommerceCustomer(customerId) {
  const customerResponse = await bigCommerceRequest(`/v3/customers?id:in=${encodeURIComponent(customerId)}`);
  const customer = customerResponse.data && customerResponse.data[0];

  if (!customer) {
    throw new Error(`BigCommerce customer not found: ${customerId}`);
  }
  console.log("customer fetched from bigcommerce: ", customer)
  return customer;
}

async function fetchBigCommerceCompany(companyId) {
  const companyResponse = await bigCommerceB2BRequest(`/api/v3/io/companies/${encodeURIComponent(companyId)}`);
  const company = companyResponse.data;

  if (!company || Object.keys(company).length === 0) {
    throw new Error(`BigCommerce company not found: ${companyId}`);
  }

  console.log('company fetched from bigcommerce: ', company);
  return company;
}

module.exports = {
  fetchBigCommerceCustomer,
  fetchBigCommerceCompany,
};
