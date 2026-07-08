function validateCompanyCreatedPayload(req, res, next) {
  const companyId = req.body.data && (req.body.data.company_id || req.body.data.id);

  if (req.body.scope !== 'store/company/created' || !companyId) {
    res.status(400).json({ error: 'Expected store/company/created payload with data.company_id' });
    return;
  }

  console.log('company payload is verified');
  next();
}

module.exports = validateCompanyCreatedPayload;
