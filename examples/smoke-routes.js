import { createApp } from '../src/index.js';

const app = createApp();

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.get('/api/users/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'User ' + req.params.id });
});

app.listen(3000, () => {
  console.log('Route smoke server listening on http://localhost:3000');
});
