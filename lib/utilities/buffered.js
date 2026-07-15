import collect from './collect.js';

// Wraps an async iterator factory into a buffering read method that returns all events as an array.
export default (iterate) => (...args) => collect(iterate(...args));
