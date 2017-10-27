import esConfig from './support/inMemEventStoreConfig';
import { spawn } from 'child_process';
import Promise from 'bluebird';

let eventstore;

before(function() {
	this.timeout(10 * 1000);

	if (eventstore === undefined) {
		console.log('Starting in-mem ES...');

		const intTcpPort = `--int-tcp-port=${esConfig.options.intTcpPort}`;
		const extTcpPort = `--ext-tcp-port=${esConfig.options.extTcpPort}`;
		const intHttpPort = `--int-http-port=${esConfig.options.intHttpPort}`;
		const extHttpPort = `--ext-http-port=${esConfig.options.extHttpPort}`;

		eventstore = spawn(esConfig.cluster, ['--mem-db=True', intTcpPort, extTcpPort, intHttpPort, extHttpPort, '--run-projections=ALL', '--start-standard-projections=True'], {
			cwd: undefined,
			stdio: ['ignore', 'ignore', process.stderr]
		});

		eventstore.on('exit', () => {
			eventstore = undefined;
		});

		return Promise.delay(4000);
	}
	return Promise.resolve();
});

after(done => {
	console.log('Killing in-mem ES...');
	if (eventstore) eventstore.kill();
	eventstore = undefined;
	done();
});