import { createNetServer } from '../src/server.js';

const server = createNetServer((req, res) => {
  res.json({ path: req.path });
});

server.listen(3000, () => {
  console.log('Smoke server listening on http://localhost:3000');
});
