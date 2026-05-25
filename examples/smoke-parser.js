import net from 'net';
import { createRequestParser } from '../src/parser.js';
import { createResponse } from '../src/response.js';

// Echoes the parsed request as JSON — verifies parser.js without routing.
const server = net.createServer((socket) => {
  const parser = createRequestParser();

  socket.on('data', (chunk) => {
    parser.feed(chunk);

    if (parser.isComplete()) {
      const req = parser.getRequest();
      const res = createResponse(socket);

      res.json({
        method: req.method,
        path: req.path,
        query: req.query,
        headers: req.headers,
        rawBody: req.rawBody,
      });
    }
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err.message);
  });
});

server.listen(3000, () => {
  console.log('Smoke parser server listening on http://localhost:3000');
});
