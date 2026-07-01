function validateCustomerCreatedPayload(req, res, next) {
  if (req.body.scope !== 'store/customer/created' || !req.body.data || !req.body.data.id) {
    res.status(400).json({ error: 'Expected store/customer/created payload with data.id' });
    return;
  }
  console.log("customer payload is verified")
  next();
}

module.exports = validateCustomerCreatedPayload;
