var assert = require('assert');
var eventstore = require('../index.js');
var uuid = require('node-uuid');
var createProjection = require('./helpers/createProjection');

describe('Http Client - Send Scavenge Command', function() {
    it('Should send scavenge command', function(done) {
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

        client.sendScavengeCommand().then(function() {
            done();
        }).catch(done);
    });
});