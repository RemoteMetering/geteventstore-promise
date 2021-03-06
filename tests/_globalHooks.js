import sleep from './utilities/sleep';
import { spawn } from 'child_process';
import path from 'path';

global.runningTestsInSecureMode = process.env.TESTS_RUN_SECURE === 'true';
const securityMode = global.runningTestsInSecureMode ? 'secure' : 'insecure';

console.log(`Running tests in \x1b[36m${securityMode}\x1b[0m mode...`);

const singleComposeFileLocation = path.join(__dirname, 'support', 'single', `docker-compose-${securityMode}.yml`);
const clusterComposeFileLocation = path.join(__dirname, 'support', 'cluster', `docker-compose-${securityMode}.yml`);
let eventstore;

const startStack = async (filePath) => new Promise((resolve, reject) => {
	const proc = spawn('docker-compose', ['--file', filePath, 'up', '-d'], {
		cwd: undefined,
		stdio: ['ignore', 'ignore', process.stderr]
	});

	proc.on('close', code => code === 0 ? resolve() : reject(code));
});

const removeStack = async (filePath) => new Promise((resolve, reject) => {
	const proc = spawn('docker-compose', ['--file', filePath, 'down', '--remove-orphans'], {
		cwd: undefined,
		stdio: ['ignore', 'ignore', process.stderr]
	});

	proc.on('close', code => {
		if (code === 0) resolve();
		else reject();
	});
});

const isContainerReady = async (containerName, readyOutputMatch) => new Promise((resolve) => {
	const proc = spawn('docker', ['logs', containerName], { cwd: undefined });
	proc.stdout.on('data', line => line.toString().includes(readyOutputMatch) && resolve(true));
	proc.on('close', () => resolve(false));
});

before(async function () {
	this.timeout(60 * 1000);
	if (eventstore) return;

	console.log('Starting EventStoreDB stacks...');

	await Promise.all([removeStack(singleComposeFileLocation), removeStack(clusterComposeFileLocation)]);
	await Promise.all([startStack(singleComposeFileLocation), startStack(clusterComposeFileLocation)]);

	while (true) {
		const [isSingleReady, isClusterReady] = await Promise.all([
			isContainerReady('geteventstore_promise_test_single.eventstore', `'"$streams"' projection source has been written`),
			isContainerReady('geteventstore_promise_test_cluster_node1.eventstore', '<LIVE> [Leader')
		]);
		if (isSingleReady && isClusterReady) break;
		await sleep(100);
	}
	await sleep(1000);
});

after(async function () {
	this.timeout(60 * 1000);
	console.log('Killing EventStoreDB stacks...');
	await Promise.all([removeStack(singleComposeFileLocation), removeStack(clusterComposeFileLocation)]);
});