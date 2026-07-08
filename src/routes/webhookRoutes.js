const express = require('express');

const { handleCustomerCreated, handleCompanyCreated } = require('../controllers/webhookController');
const validateCustomerCreatedPayload = require('../middleware/validateCustomerCreatedPayload');
const validateCompanyCreatedPayload = require('../middleware/validateCompanyCreatedPayload');
const validateWebhookSecret = require('../middleware/validateWebhookSecret');

const router = express.Router();

router.post(
  '/customer-created',
  validateWebhookSecret,
  validateCustomerCreatedPayload,
  handleCustomerCreated
);

router.post(
  '/company-created',
  validateWebhookSecret,
  validateCompanyCreatedPayload,
  handleCompanyCreated
);

module.exports = router;
