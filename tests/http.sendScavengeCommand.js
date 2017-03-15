require('./_globalHooks');

var httpConfig = require('./support/httpConfig');
var eventstore = require('../index.js');

describe('Http Client - Send Scavenge Command', function() {
    it('Should send scavenge command', function() {
        var client = eventstore.http(httpConfig);
        return client.admin.scavenge();
    });
});