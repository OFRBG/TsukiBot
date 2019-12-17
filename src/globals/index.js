class MatchingError extends Error {}

Object.defineProperty(MatchingError.prototype, 'name', {
  value: 'MatchingError'
});

module.exports = {
  MatchingError
};
