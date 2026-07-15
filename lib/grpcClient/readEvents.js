import collect from '../utilities/collect.js';

// Buffers a direction-bound iterator into the { events } result shape.
// Used for both the per-stream and $all read methods.
export default (iterate) => async (...args) => ({ events: await collect(iterate(...args)) });
