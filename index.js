var uuid = require('node-uuid');
var assert = require('assert');
var eventFactory = require('./eventFactory');

module.exports = {
	eventFactory: eventFactory,	
    http: require('./httpClient')
}
