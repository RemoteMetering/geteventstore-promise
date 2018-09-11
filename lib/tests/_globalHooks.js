import esConfig from './support/inMemEventStoreConfig';
import { spawn } from 'child_process';
import Promise from 'bluebird';
import path from 'path';

const clusterComposeFileLocation = path.join(__dirname, 'support', 'cluster', 'docker-compose.yml');
let eventstore;

const removeContainer = async () => {
	const removeProcess = spawn(`docker`, ['rm', '-f', esConfig.dockerContainerName], { detached: true });
	removeProcess.unref();
	await Promise.delay(4000);
};

const addContainer = async () => {
	const dockerParameters = [
		'run',
		'--name',
		esConfig.dockerContainerName,
		'--env=EVENTSTORE_MEM_DB=True',
		'--env=EVENTSTORE_RUN_PROJECTIONS=All',
		'--env=EVENTSTORE_START_STANDARD_PROJECTIONS=True',
		`--env=EVENTSTORE_EXT_HTTP_PORT_ADVERTISE_AS=${esConfig.options.extHttpPort}`,
		`--env=EVENTSTORE_EXT_TCP_PORT=${esConfig.options.extTcpPort}`,
		'-d',
		'-p',
		`${esConfig.options.extHttpPort}:2113`,
		'-p',
		`${esConfig.options.extTcpPort}:${esConfig.options.extTcpPort}`,
		'eventstore/eventstore'
	];

	eventstore = spawn('docker', dockerParameters, {
		cwd: undefined,
		stdio: ['ignore', 'ignore', process.stderr]
	});

	eventstore.on('exit', () => eventstore = undefined);
};

const addClusterContainers = async () => new Promise((resolve, reject) => {
	const proc = spawn('docker-compose', ['--file', clusterComposeFileLocation, 'up', '-d'], {
		cwd: undefined,
		stdio: ['ignore', 'ignore', process.stderr]
	});

	proc.on('close', code => {
		if (code === 0) resolve();
		else reject();
	});
});

const removeClusterContainers = async () => new Promise((resolve, reject) => {
	const proc = spawn('docker-compose', ['--file', clusterComposeFileLocation, 'down'], {
		cwd: undefined,
		stdio: ['ignore', 'ignore', process.stderr]
	});

	proc.on('close', code => {
		if (code === 0) resolve();
		else reject();
	});
});

before(async function () {
	this.timeout(60 * 1000);

	if (eventstore === undefined) {
		console.log('Starting in-mem ES...');

		if (esConfig.testsUseDocker) {
			await removeContainer();
			await removeClusterContainers();
			await addContainer();
			await addClusterContainers();
		} else {
			const intTcpPort = `--int-tcp-port=${esConfig.options.intTcpPort}`;
			const extTcpPort = `--ext-tcp-port=${esConfig.options.extTcpPort}`;
			const intHttpPort = `--int-http-port=${esConfig.options.intHttpPort}`;
			const extHttpPort = `--ext-http-port=${esConfig.options.extHttpPort}`;

			eventstore = spawn(esConfig.executable, ['--mem-db=True', intTcpPort, extTcpPort, intHttpPort, extHttpPort, '--run-projections=ALL', '--start-standard-projections=True'], {
				cwd: undefined,
				stdio: ['ignore', 'ignore', process.stderr]
			});

			eventstore.on('exit', () => eventstore = undefined);
		}

		return Promise.delay(10000);
	}
	return Promise.resolve();
});

after(async function () {
	this.timeout(60 * 1000);
	console.log('Killing in-mem ES...');
	if (eventstore) eventstore.kill();
	eventstore = undefined;
	if (esConfig.testsUseDocker) {
		await removeContainer();
		await removeClusterContainers();
	}
});