import net from 'net';
import { createRequestParser } from './parser.js';
import { createResponse } from './response.js';

// Wraps net.createServer: parse incoming bytes, then call onRequest(req, res).
export function createNetServer(onRequest) {
  const server = net.createServer((socket) => {
    const parser = createRequestParser();

    socket.on('data', (chunk) => {
      parser.feed(chunk);

      if (parser.isComplete()) {
        const req = parser.getRequest();
        const res = createResponse(socket);
        onRequest(req, res);
      }
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err.message);
    });
  });

  return {
    listen(port, callback) {
      server.listen(port, callback);
    },
  };
}
