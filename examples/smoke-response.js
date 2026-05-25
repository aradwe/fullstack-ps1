import net from 'net';
import { createResponse } from '../src/response.js';

// Minimal server to verify response.js — ignores the request, always returns JSON.
const server = net.createServer((socket) => {
  socket.on('data', () => {
    const res = createResponse(socket);
    res.json({ ok: true });
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err.message);
  });
});

server.listen(3000, () => {
  console.log('Smoke server listening on http://localhost:3000');
});
