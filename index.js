const eventFactory = require('./eventFactory');

module.exports = {
	eventFactory,
	http: require('./httpClient'),
	tcp: require('./tcpClient')
};