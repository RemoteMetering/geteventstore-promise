require('./_globalHooks');

var httpConfig = require('./support/httpConfig');
var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('uuid');

describe('Http Client - Send Scavenge Command', function() {
    it('Should send scavenge command', function() {
        var client = eventstore.http(httpConfig);
        return client.admin.scavenge();
    });
});