const config = require('../config');

function toHubSpotContactProperties(customer) {
  const properties = {
    email: customer.email,
    firstname: customer.first_name,
    lastname: customer.last_name,
    phone: customer.phone,
    company: customer.company,
  };

  if (config.includeBigCommerceId) {
    properties.bigcommerce_customer_id = String(customer.id);
  }

  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

module.exports = {
  toHubSpotContactProperties,
};
