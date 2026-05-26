import { getStatusText } from './statusCodes.js';

// Builds an Express-style res object for a single TCP connection.
// One request per connection for now (Connection: close).
export function createResponse(socket) {
  let statusCode = 200;
  let statusText = 'OK';
  const headers = {};
  let sent = false;

  // Serializes headers + body into HTTP/1.1 and closes the socket.
  function buildAndSend(body) {
    if (sent) {
      return;
    }
    sent = true;

    const responseHeaders = { ...headers, Connection: 'close' };

    // Byte length, not string length — matters for non-ASCII bodies
    if (body !== undefined && body !== null && body !== '') {
      responseHeaders['Content-Length'] = Buffer.byteLength(body);
    }

    // Status line + headers (CRLF is required by HTTP/1.1)
    let response = `HTTP/1.1 ${statusCode} ${statusText}\r\n`;
    for (const [key, value] of Object.entries(responseHeaders)) {
      response += `${key}: ${value}\r\n`;
    }
    response += '\r\n';

    if (body !== undefined && body !== null && body !== '') {
      response += body;
    }

    socket.end(response);
  }

  return {
    status(code) {
      statusCode = code;
      statusText = getStatusText(code);
      return this;
    },

    set(key, value) {
      headers[key] = value;
      return this;
    },

    send(text) {
      headers['Content-Type'] = 'text/plain; charset=utf-8';
      buildAndSend(String(text));
    },

    json(data) {
      headers['Content-Type'] = 'application/json';
      buildAndSend(JSON.stringify(data));
    },

    html(content) {
      headers['Content-Type'] = 'text/html; charset=utf-8';
      buildAndSend(String(content));
    },

    end() {
      buildAndSend('');
    },
  };
}
