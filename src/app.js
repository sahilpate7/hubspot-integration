const express = require('express');

const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const healthRoutes = require('./routes/healthRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

app.use(express.json({ limit: '1mb' }));

app.use('/health', healthRoutes);
app.use('/webhooks/bigcommerce', webhookRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
