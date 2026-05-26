import { createApp, json } from '../src/index.js';

const app = createApp();

app.use(json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.get('/api/users/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'User ' + req.params.id });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({
    id: Date.now(),
    name,
    email,
    created: true,
  });
});

app.listen(3000, () => {
  console.log('Route smoke server listening on http://localhost:3000');
});
