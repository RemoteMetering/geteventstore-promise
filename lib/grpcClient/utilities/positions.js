import isWhole from '../../utilities/isWholeNumber.js';

export const toAllPosition = (position, baseErr, name = 'startPosition') => {
  if (position === 'start' || position === 'end') return position;
  if (position && typeof position === 'object') {
    if (!isWhole(position.commit) || !isWhole(position.prepare)) {
      throw new Error(`${baseErr}'${name}' not valid. Needs to be an object with 'commit' and 'prepare'`);
    }
    return { commit: BigInt(position.commit), prepare: BigInt(position.prepare) };
  }
  throw new Error(`${baseErr}'${name}' not valid. Needs to be 'start', 'end' or an object with 'commit' and 'prepare'`);
};

export const toStreamRevision = (revision, baseErr, name = 'startPosition') => {
  if (revision === 'start' || revision === 'end') return revision;
  if (isWhole(revision) && BigInt(revision) >= 0n) return BigInt(revision);
  throw new Error(`${baseErr}'${name}' not valid: ${String(revision)}`);
};

export const splitPersistentSettings = (settings, toStart, baseErr) => {
  const { filter, startPosition, ...rest } = settings || {};
  const start = startPosition || rest.startFrom;
  rest.startFrom = start ? toStart(start, baseErr, 'startFrom') : 'start';
  return { filter, settings: rest };
};
