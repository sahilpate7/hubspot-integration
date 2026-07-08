const config = require('../config');

function pickFirst(source, keys) {
  return keys.map((key) => source[key]).find((value) => value !== undefined && value !== null && value !== '');
}

function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function pickExtraField(company, names) {
  if (!Array.isArray(company.extraFields)) {
    return undefined;
  }

  const normalizedNames = new Set(names.map(normalizeKey));
  const extraField = company.extraFields.find((field) => (
    normalizedNames.has(normalizeKey(field.fieldName)) ||
    normalizedNames.has(normalizeKey(field.labelName))
  ));

  return extraField && extraField.fieldValue;
}

function pickCompanyValue(company, keys, extraFieldNames = []) {
  return pickFirst(company, keys) || pickExtraField(company, extraFieldNames);
}

function toHubSpotCompanyProperties(company) {
  const properties = {
    name: pickCompanyValue(company, ['companyName', 'name', 'company_name']),
    domain: pickCompanyValue(company, ['domain', 'website', 'website_url', 'websiteUrl'], ['Domain', 'Website', 'Website URL']),
    phone: pickCompanyValue(company, ['companyPhone', 'phone', 'phone_number', 'phoneNumber']),
    address: pickCompanyValue(company, ['address', 'address1', 'address_line_1', 'addressLine1'], ['Address', 'Address 1', 'Address Line 1']),
    address2: pickCompanyValue(company, ['address2', 'address_line_2', 'addressLine2'], ['Address 2', 'Address Line 2']),
    city: pickCompanyValue(company, ['city'], ['City']),
    state: pickCompanyValue(company, ['state', 'state_or_province', 'stateOrProvince'], ['State', 'State or Province']),
    zip: pickCompanyValue(company, ['zip', 'zip_code', 'zipCode', 'postal_code', 'postalCode'], ['Zip', 'Zip Code', 'Postal Code']),
    country: pickCompanyValue(company, ['country'], ['Country']),
  };

  const companyId = pickFirst(company, ['companyId', 'id', 'company_id']);

  if (config.includeBigCommerceId && companyId) {
    properties.bigcommerce_company_id = String(companyId);
  }

  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

module.exports = {
  toHubSpotCompanyProperties,
};
