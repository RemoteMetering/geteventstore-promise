import sleep from './utilities/sleep.js';
import { spawn } from 'child_process';
import path from 'path';

global.runningTestsInSecureMode = process.env.TESTS_RUN_SECURE === 'true';
const securityMode = global.runningTestsInSecureMode ? 'secure' : 'insecure';

const runningV21 = process.env.TESTS_V21 === 'true';
const version = runningV21 ? 'v21' : 'lts';

const singleReadyMatch = runningV21 ? '"InaugurationManager" in state (Leader' : 'InaugurationManager in state (Leader';

console.log(`Running \x1b[33m${version}\x1b[0m tests in \x1b[36m${securityMode}\x1b[0m mode...`);

const singleComposeFileLocation = path.join(import.meta.dirname, 'support', version, 'single', `docker-compose-${securityMode}.yml`);
const clusterComposeFileLocation = path.join(import.meta.dirname, 'support', version, 'cluster', `docker-compose-${securityMode}.yml`);
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

// Has to be removed by root container
const cleanCerts = async (composeFilePath) => new Promise((resolve, reject) => {
	const supportDir = path.dirname(composeFilePath);
	const proc = spawn('docker', [
		'run', '--rm', '--user', '0:0', '--entrypoint', 'rm',
		'--volume', `${supportDir}:/work`,
		'eventstore/es-gencert-cli:1.0.2',
		'-rf', '/work/certs'
	], { cwd: undefined, stdio: ['ignore', 'ignore', process.stderr] });

	proc.on('close', code => code === 0 ? resolve() : reject(code));
});

const isContainerReady = async (containerName, readyOutputMatch) => new Promise((resolve) => {
	const proc = spawn('docker', ['logs', containerName], { cwd: undefined });
	proc.stdout.on('data', line => line.toString().includes(readyOutputMatch) && resolve(true));
	proc.on('close', () => resolve(false));
});

before(async function () {
	this.timeout(60 * 1000);
	if (eventstore) return;

	console.log('Starting KurrentDB stacks...');

	await Promise.all([removeStack(singleComposeFileLocation), removeStack(clusterComposeFileLocation)]);
	await Promise.all([cleanCerts(singleComposeFileLocation), cleanCerts(clusterComposeFileLocation)]);
	await Promise.all([startStack(singleComposeFileLocation), startStack(clusterComposeFileLocation)]);

	while (true) {
		const [isSingleReady, isClusterReady] = await Promise.all([
			isContainerReady(`metronomic_kurrentdb_client_test_single`, singleReadyMatch),
			isContainerReady(`metronomic_kurrentdb_client_test_cluster_node1`, '<LIVE> [Leader')
		]);
		if (isSingleReady && isClusterReady) break;
		await sleep(100);
	}
	await sleep(1000);
});

after(async function () {
	this.timeout(60 * 1000);
	console.log('Killing KurrentDB stacks...');
	await Promise.all([removeStack(singleComposeFileLocation), removeStack(clusterComposeFileLocation)]);
});