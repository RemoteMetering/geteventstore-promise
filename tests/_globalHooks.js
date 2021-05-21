import sleep from './utilities/sleep';
import { spawn } from 'child_process';
import path from 'path';

const securityMode = process.env.RUN_TESTS_SECURE === 'true' ? 'secure' : 'insecure';

console.log(`Running tests in \x1b[36m${securityMode}\x1b[0m mode...`);

const singleComposeFileLocation = path.join(__dirname, 'support', 'single', `docker-compose-${securityMode}.yml`);
const clusterComposeFileLocation = path.join(__dirname, 'support', 'cluster', `docker-compose-${securityMode}.yml`);
let eventstore;

const startStack = async (filePath) => new Promise((resolve, reject) => {
	const proc = spawn('docker-compose', ['--file', filePath, 'up', '-d'], {
		cwd: undefined,
		stdio: ['ignore', 'ignore', process.stderr]
	});

	proc.on('close', code => {
		if (code === 0) resolve();
		else reject();
	});
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

before(async function () {
	this.timeout(60 * 1000);
	if (eventstore) return;

	console.log('Starting EventStoreDB stacks...');

	await Promise.all([removeStack(singleComposeFileLocation), removeStack(clusterComposeFileLocation)]);
	await Promise.all([startStack(singleComposeFileLocation), startStack(clusterComposeFileLocation)]);

	return sleep(10000);
});

after(async function () {
	this.timeout(60 * 1000);
	console.log('Killing EventStoreDB stacks...');
	// await Promise.all([removeStack(singleComposeFileLocation), removeStack(clusterComposeFileLocation)]);
});