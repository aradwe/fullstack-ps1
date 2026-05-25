import { createRouter } from '../src/router.js';

const router = createRouter();
const helloHandler = () => {};
const userHandler = () => {};

router.get('/api/hello', helloHandler);

const userMatch = (() => {
  router.get('/api/users/:id', userHandler);
  return router.match('GET', '/api/users/42');
})();

console.assert(userMatch !== null, 'expected a match for param route');
console.assert(userMatch.handler === userHandler, 'expected user handler');
console.assert(userMatch.params.id === '42', 'expected id param to be 42');

const helloMatch = router.match('GET', '/api/hello');
console.assert(helloMatch !== null, 'expected a match for exact route');
console.assert(helloMatch.handler === helloHandler, 'expected hello handler');
console.assert(Object.keys(helloMatch.params).length === 0, 'expected no params for exact route');

console.assert(router.match('GET', '/missing') === null, 'expected no match for unknown path');
console.assert(router.match('POST', '/api/hello') === null, 'expected method mismatch to return null');

const api = createRouter();
api.get('/hello', helloHandler);

const mounted = createRouter();
mounted.mount('/api', api);

const mountMatch = mounted.match('GET', '/api/hello');
console.assert(mountMatch !== null, 'expected mounted route to match');
console.assert(mountMatch.handler === helloHandler, 'expected mounted route handler');

console.log('All router tests passed');
