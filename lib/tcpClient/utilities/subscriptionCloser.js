import debugModule from 'debug';

const debug = debugModule('metronomic-kurrentdb-client:subscriptionCloser');

// Builds the one close routine for a TCP subscription and its dedicated one-connection pool. It runs
// at most once, so the caller closing, the library dropping and a handler failure can all call it
// without the second call rejecting on a connection that was already released. Each step is guarded,
// because after a drop the subscription or connection may already be gone.
export default (connection, stop) => {
  let closing;
  return () => {
    if (!closing) {
      closing = (async () => {
        try {
          await stop();
        } catch (err) {
          debug('', 'Stopping the subscription failed: %s', err?.message);
        }
        try {
          await connection.releaseConnection();
        } catch (err) {
          debug('', 'Releasing the subscription connection failed: %s', err?.message);
        }
        await connection.closePool();
      })();
    }
    return closing;
  };
};
