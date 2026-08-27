import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import sleep from './utilities/sleep.js';
import { runningV21, version } from './support/v21.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

global.runningTestsInSecureMode = process.env.TESTS_RUN_SECURE === 'true';
const securityMode = global.runningTestsInSecureMode ? 'secure' : 'insecure';

const singleReadyMatch = runningV21 ? '"InaugurationManager" in state (Leader' : 'InaugurationManager in state (Leader';

console.log(`Running \x1b[33m${version}\x1b[0m tests in \x1b[36m${securityMode}\x1b[0m mode...`);

const singleComposeFileLocation = path.join(
  dirname,
  'support',
  version,
  'single',
  `docker-compose-${securityMode}.yml`
);
const clusterComposeFileLocation = path.join(
  dirname,
  'support',
  version,
  'cluster',
  `docker-compose-${securityMode}.yml`
);

const startStack = async (filePath) =>
  new Promise((resolve, reject) => {
    const proc = spawn('docker', ['compose', '--file', filePath, 'up', '-d'], {
      cwd: undefined,
      stdio: ['ignore', 'ignore', process.stderr]
    });

    proc.on('close', (code) => (code === 0 ? resolve() : reject(code)));
  });

const removeStack = async (filePath) =>
  new Promise((resolve, reject) => {
    const proc = spawn('docker', ['compose', '--file', filePath, 'down', '--remove-orphans'], {
      cwd: undefined,
      stdio: ['ignore', 'ignore', process.stderr]
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject();
    });
  });

// Has to be removed by root container
const cleanCerts = async (composeFilePath) =>
  new Promise((resolve, reject) => {
    const supportDir = path.dirname(composeFilePath);
    const proc = spawn(
      'docker',
      [
        'run',
        '--rm',
        '--user',
        '0:0',
        '--entrypoint',
        'rm',
        '--volume',
        `${supportDir}:/work`,
        'eventstore/es-gencert-cli:1.0.2',
        '-rf',
        '/work/certs'
      ],
      { cwd: undefined, stdio: ['ignore', 'ignore', process.stderr] }
    );

    proc.on('close', (code) => (code === 0 ? resolve() : reject(code)));
  });

const isContainerReady = async (containerName, readyOutputMatch) =>
  new Promise((resolve) => {
    const proc = spawn('docker', ['logs', containerName], { cwd: undefined });
    proc.stdout.on('data', (line) => line.toString().includes(readyOutputMatch) && resolve(true));
    proc.on('close', () => resolve(false));
  });

// Returns the node's most recent state transition, or undefined if it has not reported one yet.
const lastNodeState = async (containerName) =>
  new Promise((resolve) => {
    let output = '';
    const proc = spawn('docker', ['logs', containerName], { cwd: undefined });
    proc.stdout.on('data', (chunk) => (output += chunk.toString()));
    proc.on('close', () => {
      const transitions = output.match(/IS (LEADER|FOLLOWER)\.\.\./g);
      resolve(transitions ? transitions[transitions.length - 1] : undefined);
    });
  });

// docker logs replays the whole log, so a leadership line from an earlier term stays visible long
// after leadership has moved elsewhere. Matching on any occurrence therefore says only that a node
// was leader at some point, which let the cluster tests start writing mid election and fail with
// NotLeaderError. Wait for the latest transition on every node instead, so one leader and two
// followers is the actual current state.
const isClusterSettled = async () => {
  const states = await Promise.all(
    [1, 2, 3].map((node) => lastNodeState(`metronomic_kurrentdb_client_test_cluster_node${node}`))
  );

  return (
    states.filter((state) => state === 'IS LEADER...').length === 1 &&
    states.filter((state) => state === 'IS FOLLOWER...').length === 2
  );
};

before(async function () {
  this.timeout(60 * 1000);

  console.log('Starting KurrentDB stacks...');

  await Promise.all([removeStack(singleComposeFileLocation), removeStack(clusterComposeFileLocation)]);
  if (global.runningTestsInSecureMode) {
    await Promise.all([cleanCerts(singleComposeFileLocation), cleanCerts(clusterComposeFileLocation)]);
  }
  await Promise.all([startStack(singleComposeFileLocation), startStack(clusterComposeFileLocation)]);

  while (true) {
    const [isSingleReady, isClusterReady] = await Promise.all([
      isContainerReady(`metronomic_kurrentdb_client_test_single`, singleReadyMatch),
      isClusterSettled()
    ]);
    if (isSingleReady && isClusterReady) break;
    await sleep(250);
  }
  await sleep(1000);
});

after(async function () {
  this.timeout(60 * 1000);
  console.log('Killing KurrentDB stacks...');
  await Promise.all([removeStack(singleComposeFileLocation), removeStack(clusterComposeFileLocation)]);
});
