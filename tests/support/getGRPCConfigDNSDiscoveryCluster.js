import getCaCertPath from './getCaCertPath.js';

export default () => ({
  protocol: 'kurrentdb+discover',
  hostname: process.env.ES_HOST || 'localhost',
  port: 22137,
  useSslConnection: global.runningTestsInSecureMode,
  tlsCAFile: global.runningTestsInSecureMode ? getCaCertPath('cluster') : undefined,
  credentials: {
    username: 'admin',
    password: 'changeit'
  }
});
