import { createApp, serveStatic, json } from '../src/index.js';

const app = createApp();

app.use(json());
app.use('/static', serveStatic('public'));

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.listen(3000, () => {
  console.log('Static smoke server listening on http://localhost:3000');
  console.log('Open http://localhost:3000/static/index.html');
});
