require('dotenv').config();

const app = require('./src/app');
const config = require('./src/config');
const { assertConfig } = require('./src/config/validateEnv');

assertConfig();

app.listen(config.port, config.host, () => {
  console.log(`BigCommerce to HubSpot sync app listening on ${config.host}:${config.port}`);
});
