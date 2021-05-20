import httpConfig from './support/httpConfig';
import tcpConfig from './support/tcpConfig';
import sleep from './utilities/sleep';
import { spawn } from 'child_process';
import path from 'path';

const clusterComposeFileLocation = path.join(__dirname, 'support', 'cluster', 'docker-compose.yml');
const dockerContainerName = 'geteventstore-promise-test-eventstore';
let eventstore;

const removeContainer = async () => {
	const removeProcess = spawn(`docker`, ['rm', '-f', dockerContainerName], { detached: true });
	removeProcess.unref();
	await sleep(4000);
};

const addContainer = async () => {
	const dockerParameters = [
		'run',
		'--name',
		dockerContainerName,
		'--env=EVENTSTORE_INSECURE=true',
		'--env=EVENTSTORE_MEM_DB=true',
		'--env=EVENTSTORE_CLUSTER_SIZE=1',
		'--env=EVENTSTORE_RUN_PROJECTIONS=All',
		'--env=EVENTSTORE_START_STANDARD_PROJECTIONS=true',
		`--env=EVENTSTORE_ADVERTISE_HTTP_PORT_TO_CLIENT_AS=${httpConfig.port}`,
		`--env=EVENTSTORE_ADVERTISE_TCP_PORT_TO_CLIENT_AS=${tcpConfig.port}`,
		'--env=EVENTSTORE_DISCOVER_VIA_DNS=false',
		'--env=EVENTSTORE_ENABLE_EXTERNAL_TCP=true',
		'--env=EVENTSTORE_ENABLE_ATOM_PUB_OVER_HTTP=true',
		'--env=EVENTSTORE_ADVERTISE_HOST_TO_CLIENT_AS=127.0.0.1',
		'-d',
		'-p',
		`${httpConfig.port}:2113`,
		'-p',
		`${tcpConfig.port}:1113`,
		'eventstore/eventstore:20.10.2-bionic'
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
	if (eventstore) return;

	console.log('Starting in-mem ES...');

	await removeContainer();
	await removeClusterContainers();
	await addContainer();
	await addClusterContainers();

	return sleep(10000);
});

after(async function () {
	this.timeout(60 * 1000);
	console.log('Killing in-mem ES...');
	await removeContainer();
	await removeClusterContainers();
});