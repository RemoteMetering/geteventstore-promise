import axios from 'axios';
import https from 'https';

export default (config) => axios.create({
	headers: { Accept: 'application/json' },
	httpsAgent: config.allowInsecureSslCerts && new https.Agent({ rejectUnauthorized: false })
});