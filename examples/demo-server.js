import { createApp, json, logger, serveStatic } from '../src/index.js';

const app = createApp();

app.use('json', json());
app.use('logger', logger());
app.use('/static', 'static', serveStatic('public'));

app.get('/', (req, res) => {
  res.redirect('/static/index.html');
});

app.group('/api', (api) => {
  api.get('/hello', (req, res) => {
    res.json({ message: 'Hello, World!' });
  });

  api.get('/users/:id', (req, res) => {
    res.json({ id: req.params.id, name: 'User ' + req.params.id });
  });

  api.post('/users', (req, res) => {
    const { name, email } = req.body;
    res.status(201).json({
      id: Date.now(),
      name,
      email,
      created: true,
    });
  });
});

app.listen(3000, () => {
  console.log('Demo server running at http://localhost:3000');
  console.log('Open http://localhost:3000/static/index.html');
});
