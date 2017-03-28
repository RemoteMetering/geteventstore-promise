require('./_globalHooks');

var httpConfig = require('./support/httpConfig');
var eventstore = require('../index.js');

describe('Http Client - Send Scavenge Command', () => {
    it('Should send scavenge command', () => {
        var client = eventstore.http(httpConfig);
        return client.admin.scavenge();
    });
});