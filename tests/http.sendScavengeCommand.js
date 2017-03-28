require('./_globalHooks');

const httpConfig = require('./support/httpConfig');
const eventstore = require('../index.js');

describe('Http Client - Send Scavenge Command', () => {
    it('Should send scavenge command', () => {
        const client = eventstore.http(httpConfig);
        return client.admin.scavenge();
    });
});