import { STATES, parseExpectedVersion } from '../../utilities/toExpectedVersion.js';

const STATE_NAMES = new Map([...STATES].map(([name, sentinel]) => [sentinel, name]));

export default (expectedVersion) => {
  const parsed = parseExpectedVersion(expectedVersion);
  return typeof parsed === 'number' ? STATE_NAMES.get(parsed) : parsed;
};
