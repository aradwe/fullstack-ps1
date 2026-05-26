import { createApp } from '../src/index.js';

const app = createApp();

app.use((req, res, next) => {
  req.tag = 'mw';
  next();
});

app.get('/ping', (req, res) => {
  res.json({ pong: true, tag: req.tag });
});

app.listen(3000, () => {
  console.log('App smoke server listening on http://localhost:3000');
});
