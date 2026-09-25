import axios from 'axios';
import https from 'https';

export default (config) =>
  axios.create({
    headers: { Accept: 'application/json' },
    auth: { username: config.credentials.username, password: config.credentials.password },
    httpsAgent: !config.validateServer && new https.Agent({ rejectUnauthorized: false })
  });
