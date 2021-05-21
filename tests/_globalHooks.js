import sleep from './utilities/sleep';
import { spawn } from 'child_process';
import path from 'path';

const singleComposeFileLocation = path.join(__dirname, 'support', 'single', 'docker-compose.yml');
const clusterComposeFileLocation = path.join(__dirname, 'support', 'cluster', 'docker-compose.yml');
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
	const proc = spawn('docker-compose', ['--file', filePath, 'down'], {
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