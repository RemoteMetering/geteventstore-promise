var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');

describe('Http Client - Send Scavenge Command', function() {
    it('Should send scavenge command', function() {
        var client = eventstore.http({
            http: {
                hostname: 'localhost',
                protocol: 'http',
                port: 2113,
                credentials: {
                    username: 'admin',
                    password: 'changeit'
                }
            }
        });

        return client.admin.scavenge();
    });
});