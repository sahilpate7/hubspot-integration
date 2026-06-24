const express = require('express');

const { handleCustomerCreated } = require('../controllers/webhookController');
const validateCustomerCreatedPayload = require('../middleware/validateCustomerCreatedPayload');
const validateWebhookSecret = require('../middleware/validateWebhookSecret');

const router = express.Router();

router.post(
  '/customer-created',
  validateWebhookSecret,
  validateCustomerCreatedPayload,
  handleCustomerCreated
);

module.exports = router;
