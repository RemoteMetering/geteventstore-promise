import { spawn } from 'child_process';

export const clusterContainer = (node) => `metronomic_kurrentdb_client_test_cluster_node${node}`;

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
export const isClusterSettled = async () => {
  const states = await Promise.all([1, 2, 3].map((node) => lastNodeState(clusterContainer(node))));

  return (
    states.filter((state) => state === 'IS LEADER...').length === 1 &&
    states.filter((state) => state === 'IS FOLLOWER...').length === 2
  );
};

// Returns the container of the node whose latest transition is to leader, or undefined mid election.
export const findLeaderContainer = async () => {
  const containers = [1, 2, 3].map(clusterContainer);
  const states = await Promise.all(containers.map(lastNodeState));
  const leaders = containers.filter((_, index) => states[index] === 'IS LEADER...');
  return leaders.length === 1 ? leaders[0] : undefined;
};
