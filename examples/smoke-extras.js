import { createApp, json, logger } from '../src/index.js';

const app = createApp();

app.use('json', json());
app.use('logger', logger());

app.group('/api', (api) => {
  api.get('/hello', (req, res) => {
    res.json({ message: 'Hello!' });
  });
});

app.get('/go', (req, res) => {
  res.redirect('/static/index.html');
});

app.get('/', (req, res) => {
  res.redirect('/static/index.html');
});

app.listen(3000, () => {
  console.log('Extras smoke server listening on http://localhost:3000');
});
