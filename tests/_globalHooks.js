var esConfig = require('./support/inMemEventStoreConfig');
var spawn = require('child_process').spawn;
var Promise = require('bluebird');

var eventstore;

before(function() {
	this.timeout(10 * 1000);

	if (eventstore === undefined) {
		console.log('Starting in-mem ES...');

		var intTcpPort = '--int-tcp-port=' + esConfig.options.intTcpPort;
		var extTcpPort = '--ext-tcp-port=' + esConfig.options.extTcpPort;
		var intHttpPort = '--int-http-port=' + esConfig.options.intHttpPort;
		var extHttpPort = '--ext-http-port=' + esConfig.options.extHttpPort;

		eventstore = spawn(esConfig.cluster, ['--mem-db=True', intTcpPort, extTcpPort, intHttpPort, extHttpPort, '--run-projections=ALL', '--start-standard-projections=True'], {
			cwd: undefined,
			stdio: ['ignore', 'ignore', process.stderr]
		});

		eventstore.on('exit', function() {
			eventstore = undefined;
		});

		eventstore = eventstore;

		return Promise.delay(4000);
	}
	return Promise.resolve();
});

after(function(done) {
	console.log('Killing in-mem ES...');
	if (eventstore) eventstore.kill();
	eventstore = undefined;
	done();
});